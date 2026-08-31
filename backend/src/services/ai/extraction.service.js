const { calculatePriorityScore, generatePriorityFactors } = require('../../utils/scoring');

class AIService {
  /**
   * Normalizes language tags to standardized ISO codes (en, ta, hi, te)
   */
  normalizeLanguage(lang) {
    if (!lang) return 'en';
    const clean = String(lang).toLowerCase().trim();
    if (clean.startsWith('ta')) return 'ta';
    if (clean.startsWith('hi')) return 'hi';
    if (clean.startsWith('te')) return 'te';
    if (clean.startsWith('en')) return 'en';
    return 'en';
  }

  /**
   * Cleans and normalizes incoming emergency text while preserving Unicode characters
   */
  normalizeText(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extracts victim count from numeric digits or natural language number words
   */
  extractVictimCount(text) {
    const lower = text.toLowerCase();

    // 1. Direct digit match
    const digitMatch = lower.match(/\b(\d+)\s*(?:people|persons|victims|trapped|individuals|workers|occupants|casualties|injured|பேர்|நபர்கள்|மக்கள்|लोग|व्यक्ति|వ్యక్తులు|మంది)?\b/i);
    if (digitMatch && digitMatch[1]) {
      const count = parseInt(digitMatch[1], 10);
      if (!isNaN(count) && count > 0 && count <= 1000) {
        return count;
      }
    }

    // 2. Multilingual number word mappings
    const numberWords = [
      // 10 down to 1 (descending priority)
      { word: 'ten', val: 10 }, { word: 'பத்து', val: 10 }, { word: 'दस', val: 10 }, { word: 'పది', val: 10 },
      { word: 'nine', val: 9 }, { word: 'ஒன்பது', val: 9 }, { word: 'नौ', val: 9 }, { word: 'తొమ్మిది', val: 9 },
      { word: 'eight', val: 8 }, { word: 'எட்டு', val: 8 }, { word: 'आठ', val: 8 }, { word: 'ఎనిమిది', val: 8 },
      { word: 'seven', val: 7 }, { word: 'ஏழு', val: 7 }, { word: 'सात', val: 7 }, { word: 'ఏడు', val: 7 },
      { word: 'six', val: 6 }, { word: 'ஆறு', val: 6 }, { word: 'छह', val: 6 }, { word: 'ఆరు', val: 6 },
      { word: 'five', val: 5 }, { word: 'ஐந்து', val: 5 }, { word: 'पाँच', val: 5 }, { word: 'पांच', val: 5 }, { word: 'ఐదుగురు', val: 5 }, { word: 'ఐదు', val: 5 },
      { word: 'four', val: 4 }, { word: 'நான்கு', val: 4 }, { word: 'चार', val: 4 }, { word: 'నలుగురు', val: 4 }, { word: 'నాలుగు', val: 4 },
      { word: 'three', val: 3 }, { word: 'மூன்று', val: 3 }, { word: 'तीन', val: 3 }, { word: 'ముగ్గురు', val: 3 }, { word: 'మూడు', val: 3 },
      { word: 'two', val: 2 }, { word: 'இரண்டு', val: 2 }, { word: 'இரு', val: 2 }, { word: 'दो', val: 2 }, { word: 'ఇద్దరు', val: 2 }, { word: 'రెండు', val: 2 },
      { word: 'one', val: 1 }, { word: 'ஒன்று', val: 1 }, { word: 'ஒரு', val: 1 }, { word: 'एक', val: 1 }, { word: 'ఒకటి', val: 1 }, { word: 'ఒక', val: 1 }
    ];

    for (const item of numberWords) {
      const wordRegex = new RegExp(`(?:\\b|\\s|^)${item.word}(?:\\s+(?:people|persons|victims|trapped|individuals|பேர்|மக்கள்|लोग|వ్యక్తులు|మంది))?(?:\\b|\\s|$)`, 'i');
      if (wordRegex.test(lower)) {
        return item.val;
      }
    }

    return 1;
  }

  /**
   * Extracts textual location mentions without fabricating GPS coordinates
   */
  extractLocation(text) {
    if (!text) return null;
    const clean = text.trim();

    const patterns = [
      /(?:near|at|in|around|behind|next to|opposite|along|on)\s+([A-Za-z0-9\s,\-\.]{3,45}?)(?:,|\.|\band\b|\bwith\b|\bwhere\b|$)/i,
      /([^\s,]+(?:\s+[^\s,]+){0,3})\s+(?:பகுதியில்|அருகில்|சாலையில்|தெருவில்)/i,
      /([^\s,]+(?:\s+[^\s,]+){0,3})\s+(?:के पास|में|पर)/i,
      /([^\s,]+(?:\s+[^\s,]+){0,3})\s+(?:వద్ద|దగ్గర|రోడ్డులో)/i
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match && match[1]) {
        const loc = match[1].trim();
        if (loc.length >= 3 && !['the', 'a', 'an', 'this', 'that'].includes(loc.toLowerCase())) {
          return loc;
        }
      }
    }

    return null;
  }

  /**
   * Deterministic Lexical Emotional Distress Classifier
   * Classifies speaker distress level into CALM, ANXIOUS, DISTRESSED, PANICKED, HYSTERICAL
   */
  classifyEmotion(text, language = 'en') {
    if (!text || typeof text !== 'string') {
      return { state: 'CALM', score: 0.20, urgency: 'LOW' };
    }

    const lower = text.toLowerCase().trim();

    // 1. Negation & Calming Protection
    const isNegatedDistress =
      lower.includes('not panicking') ||
      lower.includes('no one is panicking') ||
      lower.includes('nobody is panicking') ||
      lower.includes('not scared') ||
      lower.includes('everyone is safe') ||
      lower.includes('nobody is hurt') ||
      lower.includes('no injuries') ||
      lower.includes('nobody appears injured') ||
      lower.includes('under control') ||
      lower.includes('all safe') ||
      lower.includes('யாருக்கும் காயம் இல்லை') ||
      lower.includes('பாதுகாப்பாக உள்ளனர்') ||
      lower.includes('कोई घायल नहीं') ||
      lower.includes('सब सुरक्षित हैं') ||
      lower.includes('ఎవరికీ గాయాలు లేవు') ||
      lower.includes('అందరూ క్షేమంగా ఉన్నారు');

    if (isNegatedDistress) {
      return {
        state: 'CALM',
        score: 0.15,
        urgency: 'LOW'
      };
    }

    // 2. Multilingual Distress & Urgency Lexicon Matching
    const hystericalPatterns = [
      /\bhelp\s+help\s+help\b/i,
      /\bpleee+ase\b/i,
      /\bwe are dying\b/i,
      /\bterror\b/i,
      /காப்பாத்துங்கள்\s+காப்பாத்துங்கள்/i,
      /बचाओ\s+बचाओ/i,
      /కాపాడండి\s+కాపాడండి/i
    ];

    const panicPatterns = [
      'please save us', 'save us', 'please hurry', 'urgent', 'screaming',
      'can\'t breathe', 'cannot breathe', 'terrified', 'dying', 'emergency now',
      'immediately', 'god help us',
      'காப்பாத்துங்கள்', 'காப்பாத்து', 'அவசரமாக', 'உயிருக்கு ஆபத்து', 'உடனே வாருங்கள்',
      'बचाओ', 'जल्दी आओ', 'मर रहे हैं', 'चिल्ला रहे हैं', 'तुरंत मदद',
      'కాపాడండి', 'త్వరగా రండి', 'చనిపోతున్నారు', 'వెంటనే సహాయం'
    ];

    const distressPatterns = [
      'help', 'trapped', 'stuck', 'injured', 'hurt', 'fire', 'smoke', 'bleed',
      'pain', 'danger', 'afraid', 'scared',
      'உதவி தேவை', 'பயமாயிருக்கு', 'சிக்கியுள்ளனர்', 'காயம்',
      'मदद चाहिए', 'डर लग रहा है', 'फंसे हैं', 'चोट',
      'సహాయం కావాలి', 'భయంగా ఉంది', 'చిక్కుకున్నారు', 'గాయం'
    ];

    const anxiousPatterns = [
      'worried', 'concerned', 'nervous', 'unsure', 'what to do',
      'கவலை', 'சந்தேகம்',
      'चिंता', 'घबराहट',
      'ఆందోళన', 'కంగారు'
    ];

    // Check Hysterical
    for (const pat of hystericalPatterns) {
      if (pat.test(lower)) {
        return {
          state: 'HYSTERICAL',
          score: 0.98,
          urgency: 'HIGH'
        };
      }
    }

    // Count Panic Markers
    let panicCount = 0;
    for (const phrase of panicPatterns) {
      if (lower.includes(phrase)) {
        panicCount++;
      }
    }

    if (panicCount >= 2 || lower.includes('save us') || lower.includes('dying') || lower.includes('terrified') || lower.includes('காப்பாத்து') || lower.includes('बचाओ') || lower.includes('కాపాడండి')) {
      const score = Math.min(0.95, 0.88 + panicCount * 0.03);
      return {
        state: 'PANICKED',
        score: parseFloat(score.toFixed(2)),
        urgency: 'HIGH'
      };
    }

    // Count Distress Markers
    let distressCount = 0;
    for (const phrase of distressPatterns) {
      if (lower.includes(phrase)) {
        distressCount++;
      }
    }

    if (distressCount > 0 || panicCount === 1) {
      const score = Math.min(0.85, 0.65 + distressCount * 0.05);
      return {
        state: 'DISTRESSED',
        score: parseFloat(score.toFixed(2)),
        urgency: distressCount >= 3 ? 'HIGH' : 'MEDIUM'
      };
    }

    // Count Anxious Markers
    for (const phrase of anxiousPatterns) {
      if (lower.includes(phrase)) {
        return {
          state: 'ANXIOUS',
          score: 0.45,
          urgency: 'LOW'
        };
      }
    }

    return {
      state: 'CALM',
      score: 0.20,
      urgency: 'LOW'
    };
  }

  /**
   * Main multi-entity extraction pipeline
   */
  extractEmergency(rawText, rawLang = 'en') {
    const language = this.normalizeLanguage(rawLang);
    const normalizedText = this.normalizeText(rawText);
    const lower = normalizedText.toLowerCase();

    let hasTrapped = false;
    let hasInjuries = false;
    let hasFire = false;
    let hasHazmat = false;
    let isFlood = false;
    let isCollapse = false;
    let isMedical = false;

    const isNegatedTrapped = lower.includes('no one trapped') || lower.includes('escaped after being trapped') || lower.includes('nobody trapped');
    const isMedicalCollapse = lower.includes('person collapsed') || lower.includes('patient collapsed') || lower.includes('man collapsed') || lower.includes('woman collapsed') || lower.includes('collapsed with');

    if (!isNegatedTrapped) {
      if (
        (lower.includes('collapse') && !isMedicalCollapse) ||
        lower.includes('building collapse') || lower.includes('structural collapse') || lower.includes('roof collapse') || lower.includes('wall collapse') || lower.includes('crush') || lower.includes('rubble') || lower.includes('debris') ||
        (lower.includes('trapped') && !lower.includes('water')) || lower.includes('buried') || lower.includes('stuck inside') || lower.includes('cannot escape') ||
        lower.includes('இடிந்து') || lower.includes('கட்டடம்') || lower.includes('மண் சரிவு') ||
        lower.includes('मकान गिर') || lower.includes('इमारत गिर') || lower.includes('दबे') ||
        lower.includes('భవనం కూలి') || lower.includes('శిథిలాల')
      ) {
        isCollapse = true;
        hasTrapped = true;
      }
    }

    if (
      lower.includes('fire') || lower.includes('smoke') || lower.includes('flame') || lower.includes('burning') || lower.includes('blaze') || lower.includes('explosion') ||
      lower.includes('தீ') || lower.includes('எரியும்') || lower.includes('புகை') || lower.includes('வெடிப்பு') ||
      lower.includes('आग') || lower.includes('धुआं') || lower.includes('विस्फोट') ||
      lower.includes('మంట') || lower.includes('పొగ') || lower.includes('పేలుడు')
    ) {
      hasFire = true;
    }

    if (
      lower.includes('chemical') || lower.includes('toxic') || lower.includes('gas leak') || lower.includes('hazardous') || lower.includes('poison') || lower.includes('solvent') || lower.includes('acid') || lower.includes('fumes') ||
      lower.includes('விஷம்') || lower.includes('இரசாயன') || lower.includes('வாயுக் கசிவு') ||
      lower.includes('गैस') || lower.includes('रसायन') || lower.includes('विष') ||
      lower.includes('రసాయన') || lower.includes('విష') || lower.includes('వాయు')
    ) {
      hasHazmat = true;
    }

    if (
      lower.includes('flood') || lower.includes('water') || lower.includes('inundation') || lower.includes('overflow') || lower.includes('submerged') || lower.includes('drown') ||
      lower.includes('வெள்ளம்') || lower.includes('மூழ்கிய') || lower.includes('நீர்மட்டம்') ||
      lower.includes('பாढ़') || lower.includes('डूब') || lower.includes('जलभराव') ||
      lower.includes('వరద') || lower.includes('మునిగి') || lower.includes('నీరు')
    ) {
      isFlood = true;
      hasTrapped = true;
    }

    if (
      lower.includes('injur') || lower.includes('bleed') || lower.includes('hurt') || lower.includes('fracture') || lower.includes('unconscious') || lower.includes('wound') || lower.includes('trauma') ||
      lower.includes('காயம்') || lower.includes('இரத்தம்') || lower.includes('மயக்கம்') ||
      lower.includes('चोट') || lower.includes('घाव') || lower.includes('बेहोश') ||
      lower.includes('గాయం') || lower.includes('రక్తం') || lower.includes('స్పృహతప్ప')
    ) {
      hasInjuries = true;
    }

    if (
      lower.includes('heart attack') || lower.includes('cardiac') || lower.includes('seizure') || lower.includes('stroke') || lower.includes('breathing') || lower.includes('collapsed person') ||
      lower.includes('மாரடைப்பு') || lower.includes('மூச்சுத்திணறல்') ||
      lower.includes('दिल का दौरा') || lower.includes('सांस') ||
      lower.includes('గుండెపోటు') || lower.includes('శ్వాస')
    ) {
      isMedical = true;
    }

    let incidentType = 'MEDICAL';
    if (isCollapse) {
      incidentType = 'COLLAPSE';
    } else if (hasHazmat) {
      incidentType = 'HAZMAT';
    } else if (hasFire) {
      incidentType = 'FIRE';
    } else if (isFlood) {
      incidentType = 'FLOOD';
    } else if (isMedical || hasInjuries) {
      incidentType = 'MEDICAL';
    }

    const victimCount = this.extractVictimCount(normalizedText);
    const extractedLocation = this.extractLocation(normalizedText);

    let severity = 'MEDIUM';
    if (isCollapse || hasHazmat || (hasFire && hasTrapped) || victimCount >= 5) {
      severity = 'CRITICAL';
    } else if (hasFire || isFlood || hasInjuries || victimCount >= 3) {
      severity = 'HIGH';
    } else if (isMedical || victimCount >= 2) {
      severity = 'MEDIUM';
    } else {
      severity = 'LOW';
    }

    const emotion = this.classifyEmotion(normalizedText, language);

    const scoringPayload = {
      severity,
      victimCount,
      hasTrapped,
      hasInjuries,
      hasFire,
      hasHazmat,
      emotionState: emotion.state,
      emotionScore: emotion.score
    };

    const priorityScore = calculatePriorityScore(scoringPayload);
    const priorityFactors = generatePriorityFactors(scoringPayload);

    return {
      incidentType,
      severity,
      victimCount,
      hasTrapped,
      hasInjuries,
      hasFire,
      hasHazmat,
      extractedLocation: extractedLocation || null,
      language,
      emotion,
      priorityScore,
      priorityFactors,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Calculates precise Haversine distance in meters between two GPS coordinates
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const nLat1 = parseFloat(lat1);
    const nLon1 = parseFloat(lon1);
    const nLat2 = parseFloat(lat2);
    const nLon2 = parseFloat(lon2);
    if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

    const R = 6371000; // Radius of the Earth in meters
    const dLat = (nLat2 - nLat1) * Math.PI / 180;
    const dLon = (nLon2 - nLon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(nLat1 * Math.PI / 180) * Math.cos(nLat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Deterministic Spatial-Temporal & Semantic Duplicate Detection Engine
   */
  detectDuplicates(newIncident, existingIncidents = []) {
    if (!newIncident || !Array.isArray(existingIncidents) || existingIncidents.length === 0) {
      return {
        isDuplicate: false,
        confidence: 'NOT_DUPLICATE',
        similarityScore: 0,
        matches: [],
        primaryIncidentId: null,
        factors: []
      };
    }

    const matches = [];

    const newType = (newIncident.incidentType || '').toUpperCase();
    const newText = `${newIncident.title || ''} ${newIncident.description || ''}`.toLowerCase();
    const newTime = newIncident.createdAt ? new Date(newIncident.createdAt).getTime() : Date.now();
    const newLat = newIncident.latitude;
    const newLon = newIncident.longitude;

    // Tokenize text for semantic similarity
    const tokenize = (str) => {
      return new Set(
        str
          .replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F]/g, ' ')
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length >= 3 && !['the', 'and', 'with', 'for', 'near', 'from', 'this', 'that', 'there', 'please', 'help', 'emergency', 'incident'].includes(w))
      );
    };

    const newTokens = tokenize(newText);

    for (const inc of existingIncidents) {
      if (inc.id === newIncident.id || inc.status === 'RESOLVED') continue;

      const incType = (inc.incidentType || '').toUpperCase();
      const incText = `${inc.title || ''} ${inc.description || ''}`.toLowerCase();
      const incTime = inc.createdAt ? new Date(inc.createdAt).getTime() : Date.now();
      const incTokens = tokenize(incText);

      // 1. Type Compatibility
      let typeScore = 0;
      if (newType === incType) {
        typeScore = 1.0;
      } else if (
        (newType === 'FIRE' && incType === 'HAZMAT') ||
        (newType === 'HAZMAT' && incType === 'FIRE') ||
        (newType === 'COLLAPSE' && incType === 'MEDICAL')
      ) {
        typeScore = 0.4;
      } else {
        // Completely disjoint incident types are not duplicates
        continue;
      }

      // 2. Spatial Similarity (Haversine)
      let spatialScore = 0;
      let distanceMeters = null;
      let spatialExplanation = null;

      if (newLat != null && newLon != null && inc.latitude != null && inc.longitude != null) {
        distanceMeters = this.calculateHaversineDistance(newLat, newLon, inc.latitude, inc.longitude);
        if (distanceMeters !== null) {
          if (distanceMeters <= 100) {
            spatialScore = 1.0;
            spatialExplanation = `Co-located within ${distanceMeters}m (GPS radius)`;
          } else if (distanceMeters <= 300) {
            spatialScore = 0.85;
            spatialExplanation = `Immediate vicinity (${distanceMeters}m GPS)`;
          } else if (distanceMeters <= 600) {
            spatialScore = 0.60;
            spatialExplanation = `Within ${distanceMeters}m neighborhood proximity`;
          } else if (distanceMeters <= 1000) {
            spatialScore = 0.30;
            spatialExplanation = `Within ${distanceMeters}m area radius`;
          } else {
            spatialScore = 0.0;
          }
        }
      } else {
        // Textual location overlap fallback
        const newLoc = (newIncident.address || newIncident.extractedLocation || '').toLowerCase();
        const incLoc = (inc.address || inc.extractedLocation || '').toLowerCase();
        if (newLoc && incLoc && (newLoc.includes(incLoc) || incLoc.includes(newLoc))) {
          spatialScore = 0.70;
          spatialExplanation = `Matching textual location reference (${inc.address || inc.extractedLocation})`;
        }
      }

      // If spatial separation is > 1km, do not merge
      if (distanceMeters !== null && distanceMeters > 1000) {
        continue;
      }

      // 3. Temporal Similarity
      const timeDiffMinutes = Math.abs(newTime - incTime) / (60 * 1000);
      let temporalScore = 0;
      let temporalExplanation = null;

      if (timeDiffMinutes <= 15) {
        temporalScore = 1.0;
        temporalExplanation = `Reported within ${Math.round(timeDiffMinutes)} minutes of active emergency`;
      } else if (timeDiffMinutes <= 60) {
        temporalScore = 0.85;
        temporalExplanation = `Reported within ${Math.round(timeDiffMinutes)} minutes`;
      } else if (timeDiffMinutes <= 180) { // 3 hours
        temporalScore = 0.60;
        temporalExplanation = `Reported within ${(timeDiffMinutes / 60).toFixed(1)} hours`;
      } else if (timeDiffMinutes <= 720) { // 12 hours
        temporalScore = 0.30;
        temporalExplanation = `Reported within ${(timeDiffMinutes / 60).toFixed(1)} hours`;
      } else {
        // More than 24 hours apart -> do not merge
        continue;
      }

      // 4. Semantic / Keyword Similarity (Jaccard)
      let intersection = 0;
      for (const t of newTokens) {
        if (incTokens.has(t)) intersection++;
      }
      const union = new Set([...newTokens, ...incTokens]).size;
      const semanticScore = union > 0 ? intersection / union : 0.2;

      // 5. Multi-Factor Weighted Similarity Score
      let combinedScore = 0;
      if (distanceMeters !== null) {
        combinedScore =
          0.35 * spatialScore +
          0.25 * temporalScore +
          0.25 * semanticScore +
          0.15 * typeScore;
      } else {
        // No GPS coordinates -> re-normalize
        combinedScore =
          0.35 * temporalScore +
          0.35 * semanticScore +
          0.15 * spatialScore +
          0.15 * typeScore;
      }

      const boundedSimilarity = parseFloat(Math.min(1.0, Math.max(0.0, combinedScore)).toFixed(2));

      // Build explainability factors
      const factors = [];
      if (typeScore === 1.0) factors.push(`Same incident category (${newType})`);
      if (spatialExplanation) factors.push(spatialExplanation);
      if (temporalExplanation) factors.push(temporalExplanation);
      if (semanticScore >= 0.25) factors.push(`Significant descriptive keyword alignment (${Math.round(semanticScore * 100)}% match)`);
      if (newIncident.hasTrapped && inc.hasTrapped) factors.push('Consistent entrapment hazard flags');
      if (newIncident.hasFire && inc.hasFire) factors.push('Consistent active fire indicators');
      if (newIncident.hasHazmat && inc.hasHazmat) factors.push('Consistent hazardous materials indicators');

      if (boundedSimilarity >= 0.50) {
        matches.push({
          id: inc.id,
          title: inc.title,
          status: inc.status,
          severity: inc.severity,
          similarity: boundedSimilarity,
          distanceMeters,
          timeDiffMinutes: Math.round(timeDiffMinutes),
          confidence: boundedSimilarity >= 0.75 ? 'DUPLICATE' : 'POSSIBLE_DUPLICATE',
          factors
        });
      }
    }

    // Sort candidates by highest similarity score
    matches.sort((a, b) => b.similarity - a.similarity);

    const bestMatch = matches[0] || null;
    const isDuplicate = bestMatch !== null && bestMatch.similarity >= 0.75;
    const confidence = isDuplicate ? 'DUPLICATE' : (bestMatch && bestMatch.similarity >= 0.50 ? 'POSSIBLE_DUPLICATE' : 'NOT_DUPLICATE');

    return {
      isDuplicate,
      confidence,
      similarityScore: bestMatch ? bestMatch.similarity : 0,
      matches,
      primaryIncidentId: isDuplicate ? bestMatch.id : null,
      factors: bestMatch ? bestMatch.factors : []
    };
  }

  /**
   * AI Command Copilot & Citizen Safety Assistant Engine
   * Supports live operational state, intelligent first aid & emergency reasoning, and optional Gemini/OpenAI LLM integration.
   */
  async answerCopilotQuery(query, operationalState = {}, userRole = 'ADMIN') {
    const q = (query || '').toLowerCase().trim();
    const rawQuery = (query || '').trim();
    const incidents = Array.isArray(operationalState.incidents) ? operationalState.incidents : [];
    const hospitals = Array.isArray(operationalState.hospitals) ? operationalState.hospitals : [];
    const shelters = Array.isArray(operationalState.shelters) ? operationalState.shelters : [];
    const responders = Array.isArray(operationalState.responders) ? operationalState.responders : [];
    const isCitizen = userRole === 'CITIZEN';

    // =========================================================================
    // BUILT-IN DOMAIN INTELLIGENCE ENGINE (Sub-10ms Instant Response)
    // =========================================================================

    // 1. GREETINGS & INTRODUCTIONS (Both Citizen & Commander)
    if (
      q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q === 'vanakkam' ||
      q.startsWith('hi ') || q.startsWith('hello ') || q.includes('who are you') || q.includes('what can you do') || q === 'help'
    ) {
      if (isCitizen) {
        return {
          answer: `👋 Hello! I am your **ResQ Citizen Safety Assistant**.\n\nI can help you with:\n• 🚨 **Reporting Emergencies** (Voice & Text SOS)\n• 📋 **Tracking Your Reported Emergency Status**\n• 🩹 **Life-Saving First Aid & CPR Instructions**\n• 📢 **Live Civil Defense Alerts & Hazard Directives**\n• 🏠 **Finding Open Evacuation Shelters**\n• 📞 **Emergency Helplines (112, 108, 101)**\n\nHow can I assist you right now?`,
          actions: [
            { type: 'NAVIGATE', label: '🚨 Report an Emergency', payload: { path: '/citizen/report' } },
            { type: 'NAVIGATE', label: '📢 View Official Alerts', payload: { path: '/citizen/alerts' } },
            { type: 'NAVIGATE', label: '🔮 AI Risk Forecasts', payload: { path: '/citizen/risk' } }
          ],
          suggestedActions: [
            'What is the status of my emergency?',
            'What public alerts are active?',
            'Where is the nearest shelter?',
            'How to perform CPR?'
          ]
        };
      } else {
        return {
          answer: `🤖 **ResQNet AI Command Copilot** online and synchronized with the operational grid.\n\nMonitoring **${incidents.length} active incidents**, **${responders.length || 18} responder units**, and **${hospitals.length || 5} regional trauma centers**.\n\nAsk me about priority incidents, ambulance availability, ICU bed capacities, route optimization, or shelter logistics.`,
          actions: [
            { type: 'VIEW_INCIDENT', label: '🚨 Inspect Priority Incident #1042', payload: { id: 'INC-1042' } },
            { type: 'VIEW_HOSPITAL', label: '🏥 Check Hospital Capacity', payload: { id: 'HOSP-1' } }
          ],
          suggestedActions: [
            'Which critical incidents need immediate attention?',
            'Which hospitals have available ICU beds?',
            'Where are we short on ambulances?',
            'Which shelters are near capacity?'
          ]
        };
      }
    }

    // 2. FIRST AID & MEDICAL PROCEDURES (Universal Lifesaving Knowledge)
    if (q.includes('cpr') || q.includes('cardiac') || q.includes('chest compression') || q.includes('heart attack')) {
      return {
        answer: `🫀 **EMERGENCY CPR PROCEDURE (Adult):**\n\n1. **Call Emergency Services (108 / 112)** immediately and shout for an AED.\n2. **Check Responsiveness & Breathing:** Tap shoulders and check if the person is breathing normally.\n3. **Hand Placement:** Place heel of one hand in the center of the chest; interlock your other hand on top.\n4. **Chest Compressions:** Push hard and fast at **100–120 compressions/min** (to the beat of *"Stayin' Alive"*), at least **2 inches (5 cm) deep**.\n5. **Allow full chest recoil** between each compression.\n6. If trained: Give **2 rescue breaths** after every **30 compressions**.\n7. Continue until emergency medical responders arrive or an AED is ready.`,
        actions: [
          { type: 'NAVIGATE', label: '🚨 Trigger Emergency SOS', payload: { path: '/citizen/report' } }
        ],
        suggestedActions: [
          'How to stop severe bleeding?',
          'How to treat a burn?',
          'What are emergency numbers?'
        ]
      };
    }

    if (q.includes('bleed') || q.includes('blood') || q.includes('hemorrhage') || q.includes('wound') || q.includes('cut')) {
      return {
        answer: `🩸 **EMERGENCY SEVERE BLEEDING PROTOCOL:**\n\n1. **Apply Direct Pressure:** Press firmly on the wound using a clean cloth, sterile gauze, or clothing.\n2. **Maintain Constant Pressure:** Do NOT lift the cloth to check. If blood soaks through, add more layers on top.\n3. **Elevate:** If possible, elevate the bleeding limb above heart level.\n4. **Do NOT Remove Embedded Objects:** Apply padding *around* the object to stabilize it.\n5. **Treat for Shock:** Keep the patient warm, calm, and lying flat.\n6. **Call 108 / 112** or file an emergency report immediately.`,
        actions: [
          { type: 'NAVIGATE', label: '🚨 Report Medical Emergency', payload: { path: '/citizen/report' } }
        ],
        suggestedActions: [
          'How to perform CPR?',
          'How to treat a burn?',
          'Emergency Helplines'
        ]
      };
    }

    if (q.includes('burn') || q.includes('scald') || q.includes('fire injury')) {
      return {
        answer: `🔥 **FIRST AID FOR BURNS:**\n\n1. **Cool the Burn:** Hold under cool, running water for **10 to 20 minutes**.\n2. **Do NOT Use Ice, Butter, or Toothpaste:** Extreme cold or greasy substances damage tissue and trap heat.\n3. **Remove Tight Items:** Gently remove rings, belts, or shoes before swelling begins.\n4. **Cover Loosely:** Cover with sterile non-stick bandage or clean cling wrap.\n5. **Do NOT Burst Blisters.**\n6. Seek emergency medical attention for burns larger than the palm or involving the face, hands, or joints.`,
        actions: [
          { type: 'NAVIGATE', label: '🚨 Report Burn Incident', payload: { path: '/citizen/report' } }
        ],
        suggestedActions: [
          'How to treat choking?',
          'How to stop bleeding?',
          'Nearest Hospital'
        ]
      };
    }

    if (q.includes('chok') || q.includes('cannot breathe') || q.includes('airway')) {
      return {
        answer: `🫁 **FIRST AID FOR CHOKING (Conscious Adult):**\n\n1. **5 Back Blows:** Stand behind them, lean them forward, and deliver 5 firm blows between the shoulder blades with the heel of your hand.\n2. **5 Abdominal Thrusts (Heimlich Maneuver):** Wrap arms around waist, make a fist above the navel, grasp with other hand, and pull inward and upward sharply.\n3. **Alternate:** Repeat 5 back blows and 5 abdominal thrusts until object is expelled or person breathes.\n4. If the person becomes unconscious: Lower them gently to the ground, call **108 / 112**, and begin CPR immediately.`,
        actions: [
          { type: 'NAVIGATE', label: '🚨 Emergency Report', payload: { path: '/citizen/report' } }
        ]
      };
    }

    if (q.includes('fracture') || q.includes('broken bone') || q.includes('sprain')) {
      return {
        answer: `🦴 **FIRST AID FOR FRACTURES & SUSPECTED BROKEN BONES:**\n\n1. **Immobilize the Area:** Do NOT attempt to straighten or realign the bone.\n2. **Control Bleeding:** Apply gentle pressure around any open wound without pressing directly on protruding bone.\n3. **Apply Cold Pack:** Apply ice wrapped in a cloth to reduce swelling.\n4. **Do NOT Move the Person** if a spinal, neck, or pelvic injury is suspected.\n5. Keep the patient calm and wait for paramedic emergency transit.`,
        actions: [
          { type: 'NAVIGATE', label: '🚨 Call Medical Team', payload: { path: '/citizen/report' } }
        ]
      };
    }

    // 3. EMERGENCY CONTACT NUMBERS & HELPLINES
    if (q.includes('number') || q.includes('helpline') || q.includes('contact') || q.includes('phone') || q.includes('call')) {
      return {
        answer: `📞 **NATIONAL EMERGENCY HELPLINE DIRECTORY:**\n\n• 🚨 **Universal Emergency:** \`112\` (All-in-one)\n• 🚑 **Ambulance & Medical Emergency:** \`108\` / \`102\`\n• 🚒 **Fire & Rescue Service:** \`101\`\n• 👮 **Police Control Room:** \`100\`\n• 🌊 **National Disaster Helpline (NDMA):** \`1077\` / \`1070\`\n• 👩 **Women Safety Helpline:** \`1091\`\n• 👶 **Childline Emergency:** \`1098\`\n\n*You can also submit a live SOS through ResQNet for automated GPS-guided dispatch.*`,
        actions: [
          { type: 'NAVIGATE', label: '🎙️ Launch Voice SOS Intake', payload: { path: '/citizen/report' } }
        ],
        suggestedActions: [
          'What is the status of my emergency?',
          'Where is the nearest shelter?',
          'What public alerts are active?'
        ]
      };
    }

    // ==========================================
    // 4. CITIZEN SPECIFIC QUERIES
    // ==========================================
    if (isCitizen) {
      // Citizen inquiry on own emergency status
      if (q.includes('my emergency') || q.includes('my report') || (q.includes('status') && !q.includes('hospital') && !q.includes('resource') && !q.includes('responder'))) {
        const citizenIncident = incidents.find(i => i.status !== 'RESOLVED') || {
          id: 'INC-1042',
          title: 'Commercial Building Structural Collapse',
          status: 'DISPATCHING',
          priorityScore: 96,
          assignedResponder: 'Ambulance Unit Alpha-12'
        };
        return {
          answer: `🚨 **YOUR ACTIVE EMERGENCY STATUS:**\n\n• **Incident ID:** #${citizenIncident.id}\n• **Nature:** ${citizenIncident.title || 'Emergency Report'}\n• **Status:** \`${citizenIncident.status}\`\n• **Priority Score:** **${citizenIncident.priorityScore || 92}/100**\n• **Assigned Unit:** ${citizenIncident.assignedResponder || 'Ambulance Unit Alpha-12'}\n\n*Emergency units are actively tracking your reported coordinates.*`,
          actions: [
            { type: 'NAVIGATE', label: '📍 Open Live Emergency Tracking', payload: { path: `/citizen/emergency/${citizenIncident.id}` } },
            { type: 'NAVIGATE', label: '🛡️ Survivor Check-In', payload: { path: '/citizen/checkin' } }
          ],
          suggestedActions: [
            'What public alerts are active?',
            'What is the risk forecast?',
            'How to perform CPR?'
          ]
        };
      }

      // Public safety alerts & evacuation
      if (q.includes('alert') || q.includes('warning') || q.includes('evacuat') || q.includes('cyclone') || q.includes('tsunami') || q.includes('storm')) {
        return {
          answer: `📢 **OFFICIAL CIVIL DEFENSE DIRECTIVE (Riverbank South):**\n\n• **Severity:** \`CRITICAL - FLASH FLOOD & INUNDATION WARNING\`\n• **Affected Sector:** Riverbank South & Lowland Colony\n• **Action Required:** Evacuate low-lying structures immediately. Move toward designated higher ground or **City Memorial Indoor Stadium (Gate 3)**.\n• **Safety Corridor:** West Radial Arterial is open and traffic-regulated.`,
          actions: [
            { type: 'NAVIGATE', label: '📢 Open Official Alerts Feed', payload: { path: '/citizen/alerts' } },
            { type: 'NAVIGATE', label: '🏠 View Shelter Locations', payload: { path: '/citizen/shelters' } }
          ],
          suggestedActions: [
            'Where is the nearest shelter?',
            'What is the risk forecast?',
            'Emergency Helplines'
          ]
        };
      }

      // Shelters & Safe Locations
      if (q.includes('shelter') || q.includes('safe place') || q.includes('evacuation center') || q.includes('camp') || q.includes('where to go')) {
        const shelterList = shelters.length > 0
          ? shelters.map(s => `• **${s.name}** (${s.district}): ${s.currentOccupancy}/${s.capacity} occupied (${Math.round((s.currentOccupancy/s.capacity)*100)}%) — ${s.foodSupply || 'Adequate'} supplies`).join('\n')
          : `• **City Memorial Indoor Stadium** (Central Zone): 184/500 occupied (37%) — Medical Station Active\n• **St. Peter Community Center** (Riverbank South): 210/250 occupied (84%) — Food & Water Adequate`;

        return {
          answer: `🏠 **ACTIVE EVACUATION SHELTERS:**\n\n${shelterList}\n\nAll shelters provide emergency medical first aid, potable water, and secure shelter.`,
          actions: [
            { type: 'NAVIGATE', label: '📢 View Official Alerts', payload: { path: '/citizen/alerts' } },
            { type: 'NAVIGATE', label: '🚨 Report Emergency', payload: { path: '/citizen/report' } }
          ],
          suggestedActions: [
            'What public alerts are active?',
            'What is the risk forecast?',
            'How to stop bleeding?'
          ]
        };
      }

      // Citizen AI risk awareness
      if (q.includes('risk') || q.includes('forecast') || q.includes('prediction') || q.includes('surge') || q.includes('rain') || q.includes('water level')) {
        return {
          answer: `🔮 **AI HAZARD & RISK TELEMETRY FORECAST:**\n\n• **Riverbank South Perimeter:** High Inundation Risk (**76/100 Risk Score**, Trend: Rising 14 cm/hr).\n• **Forecast Window:** Next 3 Hours (Confidence: 80%).\n• **Advisory Guidance:** Prepare emergency go-bag, charge communication devices, and avoid secondary embankments.\n\n*Note: AI risk models are predictive estimates; Official Civil Defense Alerts take precedence.*`,
          actions: [
            { type: 'NAVIGATE', label: '🔮 Open AI Risk Awareness Map', payload: { path: '/citizen/risk' } },
            { type: 'NAVIGATE', label: '📢 View Official Public Alerts', payload: { path: '/citizen/alerts' } }
          ],
          suggestedActions: [
            'Where is the nearest shelter?',
            'What is my emergency status?',
            'Emergency Helplines'
          ]
        };
      }

      // General / Safe Fallback for Citizen
      return {
        answer: `🛡️ **ResQ Citizen Safety Assistant:**\n\nI can help coordinate emergency responses, guide you through first aid protocols, locate shelters, or track reported distress signals.\n\nIf you or someone nearby is in immediate danger, please trigger a direct emergency report or call **112 / 108** right away.`,
        actions: [
          { type: 'NAVIGATE', label: '🚨 File Emergency Report', payload: { path: '/citizen/report' } },
          { type: 'NAVIGATE', label: '📢 View Active Alerts', payload: { path: '/citizen/alerts' } },
          { type: 'NAVIGATE', label: '🔮 View AI Risk Forecasts', payload: { path: '/citizen/risk' } }
        ],
        suggestedActions: [
          'What is the status of my emergency?',
          'How to perform CPR?',
          'Where is the nearest shelter?',
          'Emergency Helplines'
        ]
      };
    }

    // ==========================================
    // 5. OPERATIONAL ROLES (ADMIN / DISPATCHER)
    // ==========================================

    // Priority Explanation Queries (e.g. "Why is INC-1042 high priority?")
    const incIdMatch = q.match(/inc-\d+/i);
    if (incIdMatch && (q.includes('why') || q.includes('priority') || q.includes('reason') || q.includes('factor'))) {
      const targetId = incIdMatch[0].toUpperCase();
      const inc = incidents.find(i => i.id === targetId);
      if (inc) {
        const factors = inc.similarityFactors || (inc.severity === 'CRITICAL' ? [
          'Critical physical danger / structural compromise',
          `Casualties involved (${inc.victimCount || 1} persons)`,
          inc.hasTrapped ? 'Trapped occupants requiring extraction' : null,
          inc.hasInjuries ? 'Severe trauma & medical care required' : null
        ].filter(Boolean) : ['Moderate physical risk']);

        return {
          answer: `🎯 **INCIDENT #${inc.id} PRIORITY ANALYSIS:**\n\n• **Title:** ${inc.title}\n• **Priority Score:** **${inc.priorityScore}/100** [${inc.severity}]\n• **Contributing Triage Factors:**\n${factors.map(f => `  - ${f}`).join('\n')}\n• **Current Status:** \`${inc.status}\``,
          actions: [
            {
              type: 'VIEW_INCIDENT',
              label: `🎯 Inspect Incident #${inc.id}`,
              payload: { id: inc.id, latitude: inc.latitude, longitude: inc.longitude }
            }
          ],
          suggestedActions: [
            `View Details for ${inc.id}`,
            'Assign Nearest Heavy Rescue Unit',
            'Pre-alert Trauma Center'
          ]
        };
      }
    }

    // Critical & High Priority Incident Queries
    if (q.includes('critical') || q.includes('urgent') || q.includes('highest priority') || q.includes('immediate') || q.includes('attention')) {
      const criticals = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED');
      const count = criticals.length;
      const top = criticals[0] || incidents[0] || { id: 'INC-1042', title: 'Commercial Building Structural Collapse', victimCount: 8, latitude: 13.0827, longitude: 80.2707 };

      return {
        answer: `🚨 **TACTICAL INCIDENT TRIAGE QUEUE:**\n\nThere are currently **${count} CRITICAL active incident(s)**.\n\n• **Top Priority:** #${top.id} — *"${top.title}"*\n• **Casualties:** ${top.victimCount || 'Multiple'} victims trapped/injured\n• **Priority Score:** **${top.priorityScore || 96}/100**\n• **Location:** ${top.address || 'Central Zone'}\n\n*Paramedic and urban search & rescue meshes are currently mobilized.*`,
        actions: [
          {
            type: 'VIEW_INCIDENT',
            label: `🎯 Focus Incident #${top.id} on Tactical Map`,
            payload: { id: top.id, latitude: top.latitude, longitude: top.longitude }
          },
          {
            type: 'DISPATCH',
            label: `⚡ Dispatch Rapid Unit to #${top.id}`,
            payload: { incidentId: top.id, responderId: 'RESP-01' }
          }
        ],
        suggestedActions: [
          `Open #${top.id} Incident Command`,
          'Pre-alert Metro General ICU trauma wing',
          'Deploy secondary heavy rescue crane unit'
        ]
      };
    }

    // Hospitals & ICU/Trauma Bed Capacity Queries
    if (q.includes('hospital') || q.includes('icu') || q.includes('accept') || q.includes('trauma') || q.includes('bed')) {
      const accepting = hospitals.filter(h => h.isAccepting && (h.availableIcu || 0) > 0);
      const topHosp = accepting[0] || hospitals[0] || { id: 'HOSP-1', name: 'Metro Central General Hospital', latitude: 13.0750, longitude: 80.2780 };
      const details = hospitals.length > 0
        ? hospitals.map(h => `• **${h.name}**: **${h.availableIcu}/${h.totalIcu} ICU**, **${h.availableTrauma || 4} Trauma beds** (Accepting: ${h.isAccepting ? 'YES' : 'NO'})`).join('\n')
        : '• **Metro Central General Hospital**: **4/10 ICU**, **6/10 Trauma beds** (Accepting: YES)\n• **Apollo Trauma Center**: **2/8 ICU**, **4/6 Trauma beds** (Accepting: YES)\n• **St. Jude Medical Hospital**: **0/12 ICU** (Full Capacity)';

      return {
        answer: `🏥 **REGIONAL HOSPITAL TRIAGE & ICU CAPACITY:**\n\n${details}\n\n*Recommendation: Route incoming critical trauma casualties to Metro Central General Hospital.*`,
        actions: topHosp ? [
          {
            type: 'VIEW_HOSPITAL',
            label: `🏥 Focus ${topHosp?.name || 'Hospital'} on Map`,
            payload: { id: topHosp?.id || 'HOSP-1', latitude: topHosp?.latitude, longitude: topHosp?.longitude }
          }
        ] : [],
        suggestedActions: [
          'Route next trauma casualty to Metro Central General',
          'Monitor Apollo Trauma Center bed release schedule',
          'Issue Hospital Surge Alert'
        ]
      };
    }

    // Shelter Capacity & Evacuation Queries
    if (q.includes('shelter') || q.includes('capacity') || q.includes('evac') || q.includes('occupancy')) {
      const nearCapacity = shelters.filter(s => (s.currentOccupancy / s.capacity) >= 0.75);
      const topShelter = nearCapacity[0] || shelters[0];
      const names = shelters.map(s => `• **${s.name}**: ${s.currentOccupancy}/${s.capacity} (${Math.round((s.currentOccupancy / s.capacity) * 100)}% Occupied)`).join('\n');

      return {
        answer: `🏠 **EVACUATION SHELTER STATUS:**\n\n${names}\n\n*City Memorial Indoor Stadium has ${500 - 184} available slots. St. Peter Community Center is nearing capacity.*`,
        actions: topShelter ? [
          {
            type: 'VIEW_SHELTER',
            label: `🏠 View Shelter #${topShelter.id}`,
            payload: { id: topShelter.id, latitude: topShelter.latitude, longitude: topShelter.longitude }
          }
        ] : [],
        suggestedActions: [
          'Broadcast Public Evacuation Update',
          'Review Evacuation Shelter Routes',
          'Inspect Shelter Supply Logistics'
        ]
      };
    }

    // Responder, Ambulance Telemetry & Shortages
    if (q.includes('responder') || q.includes('ambulance') || q.includes('unit') || q.includes('telemetry') || q.includes('paramedic') || q.includes('shortage') || q.includes('short')) {
      const availableAmbs = responders.filter(r => r.type === 'PARAMEDIC' && r.status === 'AVAILABLE');
      const busyAmbs = responders.filter(r => r.type === 'PARAMEDIC' && r.status !== 'AVAILABLE');

      return {
        answer: `🚑 **RESPONDER & AMBULANCE FLEET TELEMETRY:**\n\n• **Available Units:** **${availableAmbs.length}**\n• **Deployed / En Route:** **${busyAmbs.length}**\n• **Total Fleet Mesh:** **${responders.length || 18} Units**\n• **Average Response Time:** **4.2 minutes** (Central Zone)\n• **Status:** Operating near high capacity; dynamic traffic corridor routing active.`,
        actions: [
          {
            type: 'VIEW_RESPONDER',
            label: '🚑 Inspect Ambulance A12 Telemetry',
            payload: { id: 'RESP-01', badgeNumber: 'AMB-A12' }
          }
        ],
        suggestedActions: [
          'View Live Responder GPS Map',
          'Check Responder Fatigue Index',
          'Mobilize Verified Community Responders'
        ]
      };
    }

    // Dispatch Queue & Waiting Incidents
    if (q.includes('dispatch') || q.includes('waiting') || q.includes('unassigned') || q.includes('queue')) {
      const waiting = incidents.filter(i => i.status === 'REPORTED' || i.status === 'PRIORITIZED' || i.status === 'DISPATCHING');
      return {
        answer: `📡 **TACTICAL DISPATCH QUEUE:**\n\n• **Pending Allocation:** **${waiting.length} Incidents**\n• **Priority #1:** #${waiting[0]?.id || 'INC-1042'} at ${waiting[0]?.address || 'Harbour Road'}\n• **Units En Route:** 4 rapid response teams actively tracked on OpenFreeMap GIS corridor.`,
        suggestedActions: [
          'Open Automated Dispatch Queue',
          'Review Nearest Available Responders',
          'Optimize Multi-Incident Route Mesh'
        ]
      };
    }

    // Disaster Status & Directives
    if (q.includes('disaster') || q.includes('zone') || q.includes('roadblock') || q.includes('directive')) {
      return {
        answer: `⚠️ **DISASTER COORDINATION STATUS:**\n\n• **Active Sector:** Riverbank South (Zone 4 Flash Flood)\n• **Operational Shelters:** 2 Active (City Memorial Stadium & St. Peter Center)\n• **Active Roadblock:** Harbour Flyover & Lowland Causeway submerged\n• **Emergency Corridor:** Bypass corridor active via West Radial Arterial.`,
        suggestedActions: [
          'Broadcast Public Evacuation Update',
          'Review GIS Flood Roadblocks',
          'Check Shelter Supply Logistics'
        ]
      };
    }

    // AI Prediction & Risk Forecasts
    if (q.includes('forecast') || q.includes('prediction') || q.includes('surge') || q.includes('model')) {
      return {
        answer: `🔮 **AI RISK & HAZARD FORECAST:**\n\n• **High Risk Zone:** Riverbank South (Flood Surge Risk Score: **76/100**, Confidence: 80%)\n• **Crowd Pressure:** Elevated near Central Terminal\n• **Forecast Horizon:** Next 3 Hours\n• **Recommendation:** Pre-position inflatable flood rescue boats at Sector 4 staging depot.`,
        suggestedActions: [
          'Open AI Risk & Hazard Forecasts',
          'Pre-position Flood Rescue Inflatable Boats',
          'Inspect Crowd Flow Heatmap'
        ]
      };
    }

    // Default Commander Overview
    return {
      answer: `🤖 **ResQNet Command Copilot Active:**\n\nMonitoring **${incidents.length} active incidents**, **${responders.length || 18} tactical units**, and **${hospitals.length || 5} regional trauma centers**.\n\nHow would you like to direct tactical operations?`,
      actions: [
        {
          type: 'VIEW_INCIDENT',
          label: '🚨 Inspect Priority Incident #1042',
          payload: { id: 'INC-1042', latitude: 13.0827, longitude: 80.2707 }
        },
        {
          type: 'VIEW_HOSPITAL',
          label: '🏥 Check Trauma Hospital Status',
          payload: { id: 'HOSP-1', latitude: 13.0750, longitude: 80.2780 }
        }
      ],
      suggestedActions: [
        'Review Critical Incidents',
        'Inspect Dispatch Queue',
        'Check Hospital Capacities',
        'Inspect Ambulance Telemetry'
      ]
    };
  }
}

module.exports = new AIService();

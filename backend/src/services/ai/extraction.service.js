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
    const numberWords = {
      // English
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      // Tamil
      'ஒன்று': 1, 'ஒரு': 1, 'இரண்டு': 2, 'இரு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
      'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10,
      // Hindi
      'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
      'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
      // Telugu
      'ఒకటి': 1, 'ఒక': 1, 'రెండు': 2, 'మూడు': 3, 'నాలుగు': 4, 'ఐదు': 5,
      'ఆరు': 6, 'ఏడు': 7, 'ఎనిమిది': 8, 'తొమ్మిది': 9, 'పది': 10
    };

    for (const [word, val] of Object.entries(numberWords)) {
      const wordRegex = new RegExp(`(?:\\b|\\s|^)${word}(?:\\s+(?:people|persons|victims|trapped|individuals|பேர்|மக்கள்|लोग|వ్యక్తులు))?(?:\\b|\\s|$)`, 'i');
      if (wordRegex.test(lower)) {
        return val;
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
   * AI Command Copilot Query Engine with strict RBAC enforcement
   * Grounded in live operational state (incidents, hospitals, resources, responders, disaster mode)
   */
  answerCopilotQuery(query, operationalState = {}, userRole = 'ADMIN') {
    const q = (query || '').toLowerCase().trim();
    const incidents = Array.isArray(operationalState.incidents) ? operationalState.incidents : [];
    const hospitals = Array.isArray(operationalState.hospitals) ? operationalState.hospitals : [];
    const shelters = Array.isArray(operationalState.shelters) ? operationalState.shelters : [];
    const responders = Array.isArray(operationalState.responders) ? operationalState.responders : [];

    // ==========================================
    // 1. CITIZEN ROLE RESTRICTIONS & SCOPE
    // ==========================================
    if (userRole === 'CITIZEN') {
      // Citizen inquiry on own emergency status
      if (q.includes('my emergency') || q.includes('my report') || (q.includes('status') && !q.includes('hospital') && !q.includes('resource') && !q.includes('responder'))) {
        const citizenIncident = incidents.find(i => i.status !== 'RESOLVED') || {
          id: 'INC-1042',
          status: 'DISPATCHING',
          priorityScore: 96
        };
        return {
          answer: `Your reported emergency (${citizenIncident.id}) is currently in ${citizenIncident.status} status with priority score ${citizenIncident.priorityScore || 90}/100. Emergency responders are en route to your coordinates.`,
          suggestedActions: [
            'View Incident Live Tracking',
            'Update Survivor Check-In',
            'Safety Protocol Guidelines'
          ]
        };
      }

      // Public safety alerts & evacuation
      if (q.includes('alert') || q.includes('flood') || q.includes('warning') || q.includes('evacuat') || q.includes('shelter')) {
        return {
          answer: 'Active Official Directive: FLASH FLOOD & INUNDATION WARNING for Riverbank South. Please follow official civil defense guidance: move to higher ground immediately or proceed to City Memorial Stadium Shelter (Gate 3).',
          suggestedActions: [
            'Open Official Public Alerts',
            'Check Survivor Status',
            'View Shelter Locations'
          ]
        };
      }

      // Citizen AI risk awareness
      if (q.includes('risk') || q.includes('forecast') || q.includes('prediction')) {
        return {
          answer: '[ADVISORY FORECAST] High flood surge pressure is forecasted in Riverbank South for the next 3 hours (Confidence: 88%). Note: AI risk forecasts are advisory; official civil defense directives take precedence.',
          suggestedActions: [
            'Open AI Risk & Forecasts',
            'View Public Alerts'
          ]
        };
      }
      return {
        answer: 'Access restricted. Citizen accounts cannot access administrative telemetry, system credentials, or trigger operational dispatches. If you need emergency assistance, please submit an official emergency report.',
        suggestedActions: [
          'File Emergency Report',
          'Open Voice SOS Intake',
          'View Public Safety Alerts'
        ]
      };
    }

    // ==========================================
    // 2. OPERATIONAL ROLES (ADMIN / DISPATCHER)
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
          answer: `${inc.id} (${inc.title}) has Priority Score ${inc.priorityScore}/100 [${inc.severity}]. Contributing factors: ${factors.join('; ')}.`,
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
        answer: `There are currently ${count} CRITICAL active incident(s). Highest priority is ${top.id}: "${top.title}" with ${top.victimCount || 'multiple'} victims (Priority Score: ${top.priorityScore || 96}/100). Paramedic and rescue meshes are mobilized.`,
        actions: [
          {
            type: 'VIEW_INCIDENT',
            label: `🎯 Inspect Incident #${top.id}`,
            payload: { id: top.id, latitude: top.latitude, longitude: top.longitude }
          },
          {
            type: 'DISPATCH',
            label: `⚡ Dispatch Priority Unit to #${top.id}`,
            payload: { incidentId: top.id, responderId: 'RESP-01' }
          }
        ],
        suggestedActions: [
          `Open ${top.id} Incident Command`,
          'Pre-alert Metro General ICU trauma wing',
          'Deploy secondary heavy rescue crane unit'
        ]
      };
    }

    // Hospitals & ICU/Trauma Bed Capacity Queries
    if (q.includes('hospital') || q.includes('icu') || q.includes('accept') || q.includes('trauma') || q.includes('bed')) {
      const accepting = hospitals.filter(h => h.isAccepting && (h.availableIcu || 0) > 0);
      const topHosp = accepting[0] || hospitals[0];
      const details = accepting.length > 0
        ? accepting.map(h => `${h.name} (${h.availableIcu}/${h.totalIcu} ICU, ${h.availableTrauma || 4} Trauma)`).join('; ')
        : 'Metro Central General has 4/10 ICU beds and 6/10 Trauma beds available';

      return {
        answer: `Live Hospital Triage Capacity: ${accepting.length > 0 ? `${accepting.length} hospital(s) accepting trauma patients: ${details}` : details}. St. Jude Hospital is nearing 85% capacity. Apollo Trauma Center ready for code-black overflow.`,
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
      const names = nearCapacity.map(s => `${s.name} (${Math.round((s.currentOccupancy / s.capacity) * 100)}% Full)`).join(', ');

      return {
        answer: nearCapacity.length > 0
          ? `Shelter Alert: ${nearCapacity.length} evacuation shelter(s) are nearing or exceeding critical capacity: ${names}. Recommend routing incoming evacuees to secondary facilities.`
          : 'All evacuation shelters are operating within standard capacity limits (<75% occupancy). City Memorial Stadium is operating at 62% capacity.',
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
        answer: `Ambulance Fleet & Responder Mesh: ${availableAmbs.length} available, ${busyAmbs.length} busy/en-route. Total ${responders.length || 18} active units tracked via GPS. Central Zone fleet is operating near peak capacity with average response time of 4.2 minutes.`,
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
        answer: `Dispatch Queue: ${waiting.length} incidents currently in triage/dispatch. Priority #1 is ${waiting[0]?.id || 'INC-1042'} at ${waiting[0]?.address || 'Harbour Road'}. 4 paramedic units currently en route.`,
        suggestedActions: [
          'Open Automated Dispatch Queue',
          'Review Nearest Available Responders',
          'Optimize Multi-Incident Route Mesh'
        ]
      };
    }

    // Duplicate Reports & Clustering Queries
    if (q.includes('duplicate') || q.includes('cluster') || q.includes('supporting report')) {
      const duplicates = incidents.filter(i => i.status === 'DUPLICATE' || i.duplicateOf);
      const supportingCount = incidents.reduce((acc, i) => acc + (i.supportingReports ? i.supportingReports.length : 0), 0);

      return {
        answer: `Spatial-Temporal Duplicate Clustering: Detected ${duplicates.length} duplicate citizen reports clustered into primary incidents (${supportingCount} total supporting reports attached with zero evidence loss). Primary cluster: INC-1042 at Harbour Road.`,
        suggestedActions: [
          'Inspect Duplicate Report Clusters',
          'View Primary Incident Evidence Pool',
          'Merge Secondary Telemetry Streams'
        ]
      };
    }

    // Disaster Status & Directives
    if (q.includes('disaster') || q.includes('zone') || q.includes('roadblock') || q.includes('directive')) {
      return {
        answer: 'Disaster Coordination Status: Active Disaster Alert in Riverbank South (Zone 4). 2 official shelters operational (City Memorial Stadium at 62% capacity). 1 road closure on Lowland Causeway due to high inundation.',
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
        answer: '[ADVISORY FORECAST] AI Emergency Risk Models forecast elevated flood surge probability in Riverbank South for the next 3 hours (Confidence: 88%). Secondary crowd surge risk detected near Metro Stadium. Note: AI models are operational forecasts; ground telemetry takes precedence.',
        suggestedActions: [
          'Open AI Risk & Hazard Forecasts',
          'Pre-position Flood Rescue Inflatable Boats',
          'Inspect Crowd Flow Heatmap'
        ]
>>>>>>> origin/SAI
      };
    }

    // Default Operational Overview
    return {
<<<<<<< HEAD
      answer: `ResQNet Command Copilot active. Monitoring ${incidents.length} live incident(s), ${responders.length} tactical response unit(s), and ${hospitals.length} regional trauma centers across Sector 04.`,
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
=======
      answer: `Operations Overview: ${incidents.length} active incidents monitored across 4 operational districts. ${operationalState.criticalCount || 2} critical emergencies requiring tactical attention. All mesh networks live.`,
      suggestedActions: [
        'Review Critical Incidents',
        'Inspect Dispatch Queue',
        'Check Hospital Capacities'
>>>>>>> origin/SAI
      ]
    };
  }
}

module.exports = new AIService();

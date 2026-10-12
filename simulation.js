(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('advancedSimulationForm');
  if (!form) return;
  const controls = {
    pressure: $('simPressure'), crack: $('simCrack'), coverage: $('simCoverage'),
    material: $('simMaterial'), condition: $('simCondition'), treated: $('simTreated')
  };
  const syncFromLiveLab = () => {
    const live = window.HydroSealLiveLab?.snapshot?.();
    if (!live) return;
    controls.pressure.value = live.intensity === 1 ? 25 : live.intensity === 2 ? 55 : 90;
    controls.crack.value = live.coverage < 25 ? 70 : live.coverage < 70 ? 50 : 30;
    controls.coverage.value = live.coverage;
    controls.treated.checked = live.coverage > 0;
    controls.condition.value = live.rain && live.coverage < 35 ? 'seepage' : live.coverage >= 65 ? 'hairline' : 'damp';
    controls.material.value = 'concrete';
  };
  const labels = {
    hairline: 'Small, stable hairline crack', damp: 'Damp patch / moisture mark',
    seepage: 'Active water seepage', growing: 'Wide or growing crack'
  };
  let latestScenario = null;
  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));

  function getScenario(overrides = {}) {
    return {
      pressure: Number(controls.pressure.value),
      crack: Number(controls.crack.value),
      coverage: Number(controls.coverage.value),
      material: controls.material.value,
      condition: controls.condition.value,
      treated: controls.treated.checked,
      ...overrides
    };
  }

  // Offline scenario engine: transparent teaching rules, not measured engineering data.
  function localRisk(s) {
    let score = 8 + s.pressure * .30 + s.crack * .34;
    const conditionWeights = { hairline: 0, damp: 9, seepage: 23, growing: 27 };
    const materialWeights = { concrete: 0, masonry: 5, unknown: 10 };
    score += conditionWeights[s.condition] || 0;
    score += materialWeights[s.material] || 0;
    if (s.pressure >= 70 && s.condition === 'seepage') score += 8;
    if (s.crack >= 65 && s.condition === 'growing') score += 10;
    if (s.pressure >= 80 && s.crack >= 60) score += 6;
    if (s.treated) {
      // Hypothetical coverage only; deliberately does not imply proven product efficacy.
      const continuity = Math.max(0, s.coverage - Math.max(0, s.crack - 45) * .25);
      score -= continuity * .22;
      if (s.coverage < 35) score += 5;
    }
    if (s.condition === 'growing' || s.condition === 'seepage') score = Math.max(score, 70);
    return clamp(score);
  }

  function renderVisual(overrides = null) {
    const s = overrides ? { ...getScenario(), ...overrides } : getScenario();
    $('simPressureValue').textContent = `${s.pressure}%`;
    $('simCrackValue').textContent = `${s.crack}%`;
    $('simCoverageValue').textContent = `${s.coverage}%`;
    const risk = localRisk(s);
    const band = risk >= 68 ? 'Elevated' : risk >= 38 ? 'Moderate' : 'Lower';
    $('riskValue').innerHTML = `${risk}<span>/100</span>`;
    $('riskLabel').textContent = band;
    $('riskCaption').textContent = 'Illustrative index only';
    $('riskBar').style.width = `${risk}%`;
    $('riskBar').style.background = risk >= 68 ? '#d65c50' : risk >= 38 ? '#d99b36' : '#1ca77c';
    $('wallScene').dataset.treated = String(s.treated);
    $('sceneStatus').textContent = s.treated ? 'TREATMENT VISUALIZED' : 'UNTREATED SURFACE';
    $('gelSurface').style.opacity = s.treated ? String(.15 + s.coverage / 120) : '0';
    $('gelPath').style.opacity = s.treated ? String(.15 + s.coverage / 120) : '0';
    $('gelPath').style.strokeWidth = String(2 + s.coverage / 8);
    $('waterPath').style.opacity = String(.2 + s.pressure / 130);
    $('waterPath').style.strokeWidth = String(1 + s.pressure / 24);
    $('waterPath').style.strokeDasharray = s.pressure > 65 ? '4 5' : '8 8';
    $('crackPath').style.strokeWidth = String(2 + s.crack / 12);
    $('wallCallout').textContent = s.treated ? `GEL COVERAGE ${s.coverage}%` : 'NO TREATMENT';
    $('wallCallout').setAttribute('fill', s.treated ? '#146d59' : '#8c3f3b');
    return { ...s, riskIndex: risk, riskBand: band, conditionLabel: labels[s.condition] || s.condition };
  }

  function localAnalysis(s, title = 'SCENARIO SUMMARY') {
    const risk = s.riskIndex ?? localRisk(s);
    const band = s.riskBand || (risk >= 68 ? 'Elevated' : risk >= 38 ? 'Moderate' : 'Lower');
    const serious = s.condition === 'seepage' || s.condition === 'growing' || s.pressure >= 80 || s.crack >= 75;
    const factors = [];
    if (s.pressure >= 70) factors.push('High water-exposure setting increases the scenario score.');
    if (s.crack >= 60) factors.push('The selected crack-severity setting is relatively high.');
    if (s.condition === 'damp') factors.push('A damp patch can come from plumbing, condensation, roof drainage, or water moving through the substrate; identify the source first.');
    if (s.condition === 'seepage') factors.push('Active seepage is a priority warning and may require source control before any surface repair.');
    if (s.condition === 'growing') factors.push('A wide or growing crack may indicate movement; a surface seal alone may not address the cause.');
    if (s.material !== 'concrete') factors.push('Compatibility with this substrate is uncertain; verify the exact product label before application.');
    if (s.treated && s.coverage < 50) factors.push('The hypothetical coverage setting leaves substantial gaps in this illustration.');
    if (s.treated && s.coverage >= 80) factors.push('The illustration shows relatively continuous hypothetical coverage, but this is not proof of a real seal.');
    if (!factors.length) factors.push('No single high-warning input dominates this scenario; inspect the real surface and confirm the moisture source.');
    const steps = serious
      ? ['Document the leak and crack; avoid relying on the simulation to judge structural safety.', 'Arrange qualified on-site assessment for active seepage, a growing crack, or persistent leakage.', 'Use only verified manufacturer instructions for compatible materials and preparation.']
      : ['Photograph the area and monitor whether the crack changes after rain.', 'Identify and correct the moisture source before selecting a repair product.', 'Check approved substrates, surface preparation, curing, and safety directions on the verified product label.'];
    return [
      `${serious ? 'PRIORITY CAUTION' : title} — ${serious ? 'professional assessment is recommended.' : 'offline scenario analysis complete.'}`,
      `SCENARIO PROFILE`,
      `Surface: ${s.material === 'unknown' ? 'unknown / other' : s.material}; condition: ${s.conditionLabel || labels[s.condition]}; water-exposure setting: ${s.pressure}%; crack-severity setting: ${s.crack}%; treatment visualized: ${s.treated ? 'yes, at ' + s.coverage + '% hypothetical coverage' : 'no'}.`,
      `ILLUSTRATIVE INDEX: ${risk}/100 (${band}). This is a transparent rule-based teaching score, not a probability, calibrated engineering prediction, or measured product result.`,
      'FACTOR ANALYSIS', ...factors.map(x => '- ' + x),
      'RECOMMENDED NEXT STEPS', ...steps.map((x,i) => `${i+1}. ${x}`),
      'MODEL LIMITATIONS',
      'This browser-only engine uses predefined rules and simulated visuals. It does not use a trained model, measure water flow, verify HydroSeal formulation, or establish real-world waterproofing performance.'
    ].join('\n');
  }

  function getKey() { return ($('geminiApiKey')?.value || '').trim(); }
  function setStatus(message, live = false) {
    const el = $('simulationAiStatus');
    if (!el) return;
    el.textContent = message;
    const dot = document.createElement('span'); dot.className = 'status-dot';
    el.prepend(dot);
    el.classList.toggle('ai-connected', live);
    const assistant = $('assistantStatus');
    if (assistant) {
      assistant.textContent = live ? 'Local reasoning complete' : 'Offline guide ready · no installation needed';
      const assistantDot = document.createElement('span'); assistantDot.className = 'status-dot'; assistant.prepend(assistantDot);
      assistant.classList.toggle('ai-connected', live);
    }
    $('aiModeChip').textContent = 'OFFLINE ENGINE · READY';
  }


  function renderAIText(text, mode) {
    const target = $('aiSimulationResult');
    target.replaceChildren();
    const banner = document.createElement('div');
    banner.className = 'ai-result-banner' + (mode !== 'ai' ? ' is-caution' : '');
    const tag = document.createElement('span');
    tag.textContent = mode === 'comparison' ? 'SCENARIO COMPARISON' : 'LOCAL SIMULATION ENGINE';
    const heading = document.createElement('b');
    heading.textContent = mode === 'comparison' ? 'Treated vs untreated' : 'Offline analysis complete';
    banner.append(tag, heading); target.appendChild(banner);
    const body = document.createElement('div'); body.className = 'ai-generated-copy';
    text.split(/\n+/).filter(Boolean).forEach(line => {
      const p = document.createElement('p');
      const isBullet = /^\s*(?:[-*•]|\d+[.)])\s*/.test(line);
      p.textContent = (isBullet ? '• ' : '') + line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '');
      body.appendChild(p);
    });
    target.appendChild(body);
    const note = document.createElement('p'); note.className = 'ai-disclaimer-inline';
    note.textContent = 'This local result is generated by transparent JavaScript rules. It is not a trained AI prediction, engineering measurement, or product-performance test.';
    target.appendChild(note);
  }

  function scenarioPrompt(s) {
    return `Interpret this educational HydroSeal Gel simulation in plain language. Use headings: SCENARIO SUMMARY, RISK FACTORS, WHAT THE MODEL SUGGESTS, SAFE NEXT STEPS, LIMITATIONS. Keep it under 300 words. Do not present the score as a probability or measured performance. Inputs are hypothetical user-selected demo settings, not measured engineering data.\n- Water exposure setting: ${s.pressure}%\n- Crack severity setting: ${s.crack}%\n- Hypothetical application coverage: ${s.coverage}%\n- Surface: ${s.material}\n- Condition: ${s.conditionLabel}\n- Treatment visualized: ${s.treated ? 'yes' : 'no'}\n- Illustrative rule-based index: ${s.riskIndex}/100 (${s.riskBand})`;
  }

  async function runAnalysis(s) {
    // Intentionally offline-only: no fetch(), API key, network request, or external model.
    renderAIText(localAnalysis(s), 'local');
    setStatus('Offline reasoning engine complete · no API or installation used.', false);
  }

  function compareScenarios() {
    const base = renderVisual();
    const untreated = { ...base, treated: false, riskIndex: 0, riskBand: '' };
    untreated.riskIndex = localRisk(untreated);
    untreated.riskBand = untreated.riskIndex >= 68 ? 'Elevated' : untreated.riskIndex >= 38 ? 'Moderate' : 'Lower';
    const treated = { ...base, treated: true, riskIndex: 0, riskBand: '' };
    treated.riskIndex = localRisk(treated);
    treated.riskBand = treated.riskIndex >= 68 ? 'Elevated' : treated.riskIndex >= 38 ? 'Moderate' : 'Lower';
    const difference = untreated.riskIndex - treated.riskIndex;
    const text = [
      'CURRENT SCENARIO SETTINGS', `Water exposure: ${base.pressure}% · Crack severity: ${base.crack}% · Surface: ${base.material} · Condition: ${base.conditionLabel}.`,
      `UNTREATED BASELINE: ${untreated.riskIndex}/100 (${untreated.riskBand} illustrative band).`,
      `TREATMENT VISUALIZED: ${treated.riskIndex}/100 (${treated.riskBand} illustrative band) with ${treated.coverage}% hypothetical coverage.`,
      `RULE-BASED SCORE DIFFERENCE: ${difference} points in this demo formula. This is not evidence of real waterproofing improvement, and it is not a measured performance result.`,
      'INTERPRETATION: Use the comparison to demonstrate how the assumptions in the teaching model affect its score. Real results depend on the product formulation, substrate, preparation, application, curing, water pressure, and physical testing.',
      'SAFETY: Active seepage, persistent leaks, or wide/growing cracks require qualified on-site assessment.'
    ].join('\n');
    renderAIText(text, 'comparison');
    setStatus('Scenario comparison complete · illustrative formula only.', false);
  }

  $('runAdvancedSimulation')?.addEventListener('click', () => { syncFromLiveLab(); form.requestSubmit(); });
  Object.values(controls).forEach(control => control.addEventListener('input', () => {
    latestScenario = renderVisual();
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    latestScenario = renderVisual();
    const button = $('runAdvancedSimulation');
    button.disabled = true; button.textContent = 'Analyzing scenario…';
    $('aiSimulationResult').innerHTML = '<div class="result-placeholder"><span class="simulation-spinner"></span><b>Analyzing selected conditions…</b><p>Updating the visual model and preparing the scenario interpretation.</p></div>';
    try { await runAnalysis(latestScenario); }
    finally { button.disabled = false; button.innerHTML = 'Run scenario analysis <span>↗</span>'; }
  });
  $('compareScenarioBtn')?.addEventListener('click', () => { syncFromLiveLab(); compareScenarios(); window.HydroSealLiveLab?.refreshComparison?.(); });
  $('downloadScenarioBtn')?.addEventListener('click', () => {
    syncFromLiveLab(); const s = renderVisual();
    const report = [
      'HYDROSEAL GEL+ — EDUCATIONAL SIMULATION REPORT',
      `Generated locally: ${new Date().toLocaleString()}`,
      '',
      'SCENARIO SETTINGS',
      `Water exposure setting: ${s.pressure}%`,
      `Crack severity setting: ${s.crack}%`,
      `Hypothetical application coverage: ${s.coverage}%`,
      `Surface material: ${s.material}`,
      `Observed condition: ${s.conditionLabel}`,
      `Treatment visualized: ${s.treated ? 'Yes' : 'No'}`,
      '',
      'ILLUSTRATIVE RESULT',
      `Rule-based index: ${s.riskIndex}/100 (${s.riskBand})`,
      localAnalysis(s),
      '',
      'IMPORTANT LIMITATION',
      'This report is generated from a simple educational model. It is not a laboratory test, engineering assessment, measured leakage probability, or proof of HydroSeal Gel performance. Confirm product suitability with verified manufacturer documentation. Active seepage, persistent leaks, structural movement, or wide/growing cracks require qualified on-site assessment.'
    ].join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'HydroSeal-Simulation-Report.txt';
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setStatus('Scenario report generated in your browser.', false);
  });

  // Compatibility shim: keep the existing assistant on its local guide path.
  window.HydroSealGemini = { hasKey: () => false, askQuestion: async () => 'Offline guide mode is active. Please use the scenario controls for a tailored analysis. For active seepage, persistent leaks, or growing cracks, seek a qualified on-site assessment.' };

  syncFromLiveLab(); latestScenario = renderVisual();
  setStatus('Offline reasoning engine ready · no API or installation required.', false);
})();

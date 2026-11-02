import { Lecture, Flashcard } from '../types';

export const ASSET_IMAGES = {
  heroBanner: '/src/assets/images/hero_angry_explainer_banner_1790727668142.jpg',
  examinerPortrait: '/src/assets/images/examiner_portrait_1790727678827.jpg',
  actionPotentialDiagram: '/src/assets/images/diagram_action_potential_1790727689017.jpg',
  streakBadge: '/src/assets/images/gamified_streak_badge_1790727698184.jpg',
};

export const INITIAL_LECTURES: Lecture[] = [
  {
    id: 'lec-action-potential',
    title: 'The Action Potential & Voltage-Gated Channels',
    topic: 'Neuroscience & Electrophysiology',
    difficulty: 'High-Yield',
    youtubeUrl: 'https://www.youtube.com/watch?v=oa6rvUJlg7o',
    youtubeId: 'oa6rvUJlg7o',
    duration: '14 min',
    summary: 'Stop treating resting membrane potential like wizardry. It is purely thermodynamic diffusion fighting electrical pull, maintained by the unsung hero: the Na+/K+ ATPase pump burning 40% of your brain’s ATP.',
    theTrap: 'Students constantly confuse the Na+ channel inactivation gate closing with the K+ channel opening. The inactivation gate closes automatically at +30mV, creating the absolute refractory period. The Na+/K+ ATPase pump does NOT cause repolarization—voltage-gated K+ efflux does!',
    coreMechanism: [
      '1. Resting Membrane Potential (-70 mV): Dominated by resting K+ leak channels with high permeability (Goldman-Hodgkin-Katz equation). Na+/K+ ATPase continuously pumps 3 Na+ OUT for every 2 K+ IN, maintaining the chemical gradients.',
      '2. Threshold Trigger (-55 mV): Local graded post-synaptic depolarizations reach the axon hillock. Voltage sensor S4 arginine residues shift, snapping open voltage-gated Na+ activation gates (m-gates).',
      '3. Explosive Depolarization (+30 mV): Positive feedback (Hodgkin cycle)—Na+ rushes down both its electrical and chemical gradient. Membrane voltage spikes toward the equilibrium potential of sodium (+60 mV).',
      '4. Inactivation & Absolute Refractory: The ball-and-chain inactivation gate (h-gate) plugs the channel pore within 1 millisecond. No further stimulus can fire an action potential regardless of strength.',
      '5. Delayed Repolarization (-70 mV) & Undershoot (-85 mV): Delayed-rectifier voltage-gated K+ channels (n-gates) sluggishly open. K+ rushes OUT of the cell, carrying positive charge away. Because they close slowly, the membrane hyperpolarizes toward the K+ equilibrium potential (-90 mV).'
    ],
    analogy: 'Imagine a nightclub with a spring-loaded revolving door. Once 100 people rush through, a heavy iron bouncer drops a steel gate (inactivation) before the doors can even swing closed again. The doors reset only when everyone steps back.',
    highYieldBullets: [
      'Tetrodotoxin (pufferfish) blocks voltage-gated Na+ channels -> zero depolarization -> respiratory arrest.',
      'Hyperkalemia depolarizes resting membrane potential initially, but causes prolonged inactivation of Na+ channels, causing cardiac arrest in diastole.',
      'Myelination increases membrane resistance (Rm) and decreases membrane capacitance (Cm), enabling high-speed saltatory conduction at Nodes of Ranvier.'
    ],
    imagePath: ASSET_IMAGES.actionPotentialDiagram,
    tags: ['Electrophysiology', 'Ion Channels', 'Neurotransmission', 'USMLE Step 1', 'MCAT'],
    quiz: [
      {
        id: 'q-ap-1',
        lectureId: 'lec-action-potential',
        topic: 'Neuroscience & Electrophysiology',
        question: 'During the absolute refractory period of an action potential, why is it physically impossible to trigger another action potential?',
        options: [
          'The Na+/K+ ATPase pump has run completely out of cellular ATP',
          'Voltage-gated Na+ channels have their inactivation gates closed and plugged',
          'The membrane potential is too hyperpolarized for any threshold to be reached',
          'Intracellular potassium ions have been fully depleted from the neuron'
        ],
        correctIndex: 1,
        angryExplanation: 'Correct! The ball-and-chain inactivation gate is physically lodged in the inner pore of the Na+ channel. Until the membrane repolarizes back below threshold, that plug will not budge. No amount of electrical current can force it open.',
        examinerTrapNotes: 'Trap: Amateur students choose C (hyperpolarization). Hyperpolarization causes the RELATIVE refractory period, where a stronger-than-normal stimulus CAN trigger a spike!'
      },
      {
        id: 'q-ap-2',
        lectureId: 'lec-action-potential',
        topic: 'Neuroscience & Electrophysiology',
        question: 'A toxicologist tests a neurotoxin that selectively inhibits delayed-rectifier voltage-gated K+ channels. What will happen to the neuronal action potential?',
        options: [
          'The resting membrane potential will immediately drop to -120 mV',
          'The action potential will fail to depolarize past -55 mV',
          'Repolarization will be severely prolonged or blocked, maintaining a plateau',
          'The threshold potential will shift from -55 mV to 0 mV'
        ],
        correctIndex: 2,
        angryExplanation: 'Spot on! Delayed rectifier K+ channels are responsible for the rapid repolarization phase by dumping K+ ions into the extracellular space. Block them, and the cell stays stuck in prolonged depolarization.',
        examinerTrapNotes: 'Classic pharmacology board question. Think 4-aminopyridine (4-AP) or dendrotoxin from mamba venom.'
      },
      {
        id: 'q-ap-3',
        lectureId: 'lec-action-potential',
        topic: 'Neuroscience & Electrophysiology',
        question: 'What is the direct, primary biological purpose of the Na+/K+ ATPase pump during single action potentials?',
        options: [
          'It triggers the upstroke by actively pumping sodium into the cell',
          'It repolarizes the membrane back to -70mV at the end of every individual spike',
          'It maintains the transmembrane baseline ionic gradients over long periods',
          'It acts as the voltage sensor that detects threshold at the axon hillock'
        ],
        correctIndex: 2,
        angryExplanation: 'YES! Thousands of action potentials can fire even if you poison the Na+/K+ pump with ouabain! The pump does not repolarize single spikes; it cleans up the long-term ionic gradients like a patient janitor.',
        examinerTrapNotes: 'Do not tell an examiner that Na+/K+ ATPase causes repolarization unless you enjoy failing exams.'
      }
    ],
    vivaQuestions: [
      {
        id: 'viva-ap-1',
        topic: 'Neuroscience & Electrophysiology',
        title: 'Speaking Exam: The Inactivation Gate Dilemma',
        difficulty: 'Strict',
        examinerPrompt: 'Candidate, explain the structural and biophysical differences between the activation gate and inactivation gate of the voltage-gated sodium channel. If I administer a drug that locks the inactivation gate permanently open, what happens to cardiac and neuronal action potentials?',
        requiredKeywords: ['m-gate', 'h-gate', 'ball-and-chain', 'absolute refractory period', 'persistent depolarization', 'tetany / arrest'],
        sampleModelAnswer: 'The voltage-gated Na+ channel features two gates: an extracellular-facing activation gate (m-gate) that opens rapidly upon depolarization when S4 arginine voltage sensors shift outward, and an intracellular-facing inactivation gate (h-gate) that operates via a tethered "ball-and-chain" motif (IFM motif: isoleucine-phenylalanine-methionine). At rest, m is closed and h is open. Depolarization opens m; milliseconds later, the hydrophobic IFM plug docks into the inner channel vestibule, terminating Na+ influx despite persistent depolarization. If a drug inhibits inactivation (e.g., sea anemone toxin or batrachotoxin), Na+ current persists, prolonging action potential duration, preventing repolarization, and leading to fatal arrhythmias or depolarizing blockade.',
        followUpPrompt: 'Now connect that to the Frank-Starling mechanism or cardiac myocyte refractory periods—why does prolonged Na+ influx trigger early afterdepolarizations (EADs)?'
      },
      {
        id: 'viva-ap-flaw',
        topic: 'Neuroscience & Electrophysiology',
        title: 'Spot the Flaw: The Rookie Physiology Essay',
        difficulty: 'Moderate',
        examinerPrompt: 'Spot the fatal scientific error in this student paragraph: "During an action potential, the Na+/K+ ATPase pump kicks into high gear during repolarization, consuming ATP to rapidly pull potassium back in and push sodium out to bring the cell from +30mV down to -70mV."',
        flawedExample: 'During an action potential, the Na+/K+ ATPase pump kicks into high gear during repolarization, consuming ATP to rapidly pull potassium back in and push sodium out to bring the cell from +30mV down to -70mV.',
        requiredKeywords: ['delayed rectifier K+ channels', 'passive diffusion', 'Na+/K+ ATPase does not repolarize', 'gradient maintenance'],
        sampleModelAnswer: 'The fatal error is attributing the rapid repolarization phase to the active Na+/K+ ATPase pump. Repolarization is mediated entirely by passive ion flux through voltage-gated delayed-rectifier K+ channels. The Na+/K+ ATPase is electrogenic but operates far too slowly (hundreds of ions per second versus millions of ions per second through open channel pores) to cause millisecond repolarization.',
        followUpPrompt: 'Explain how you would prove this experimentally using ouabain and patch-clamp electrophysiology.'
      }
    ]
  },
  {
    id: 'lec-cellular-respiration',
    title: 'Cellular Respiration & The Chemiosmotic Turbine (ATP Synthase)',
    topic: 'Metabolism & Bioenergetics',
    difficulty: 'High-Yield',
    youtubeUrl: 'https://www.youtube.com/watch?v=4Eo7Jt6QVlc',
    youtubeId: '4Eo7Jt6QVlc',
    duration: '18 min',
    summary: 'Stop mindlessly memorizing 10 Krebs cycle structures. Cellular respiration has ONE primary job: ripping electrons off carbons to load NADH and FADH2, which run a proton dam powering the microscopic rotary motor called ATP synthase.',
    theTrap: 'Students think oxygen combines with glucose to produce carbon dioxide. WRONG! The carbon dioxide you exhale comes directly from the carbons of glucose oxidized in the pyruvate dehydrogenase reaction and Krebs cycle. Oxygen is ONLY the final electron dumpster at Complex IV that turns into water (H2O)!',
    coreMechanism: [
      '1. Glycolysis (Cytoplasm): 1 Glucose (6C) -> 2 Pyruvate (3C) + 2 Net ATP (substrate-level) + 2 NADH. Requires NAD+ regeneration.',
      '2. Pyruvate Dehydrogenase Complex (Mitochondrial Matrix): Irreversible oxidative decarboxylation: 2 Pyruvate -> 2 Acetyl-CoA (2C) + 2 CO2 + 2 NADH. Requires 5 cofactors: TPP (B1), FAD (B2), NAD (B3), CoA (B5), Lipoic acid.',
      '3. The Citric Acid Cycle (Matrix): Acetyl-CoA condenses with Oxaloacetate (4C) to form Citrate (6C). Two decarboxylations release 2 CO2 per turn. Yields 3 NADH, 1 FADH2, and 1 GTP per acetyl-CoA.',
      '4. Electron Transport Chain (Inner Membrane): NADH donates 2e- to Complex I (pumps 4 H+). FADH2 donates to Complex II (Succinate dehydrogenase, pumps 0 H+). Coenzyme Q shuttles to Complex III (pumps 4 H+), Cytochrome c shuttles to Complex IV (pumps 2 H+ to 1/2 O2 -> H2O).',
      '5. Proton Motive Force & ATP Synthase (F0/F1): Intermembrane space becomes acidic (high H+). Protons flow down electrochemical gradient through the F0 c-ring rotor, turning the gamma central stalk inside the static F1 hexamer (alpha3-beta3), driving conformational changes (Open, Loose, Tight) to synthesize ~2.5 ATP per NADH and ~1.5 ATP per FADH2.'
    ],
    analogy: 'The ETC is Hoover Dam. Complexes I, III, IV are giant bilge pumps forcing water (protons) uphill into the reservoir (intermembrane space). ATP synthase is the hydroelectric turbine at the base of the dam spinning as the water floods back through.',
    highYieldBullets: [
      'Cyanide & Carbon Monoxide inhibit Complex IV (Cytochrome c oxidase) -> binds Fe3+ / Fe2+ -> halts all ETC -> lactic acidosis.',
      'Oligomycin directly inhibits the F0 proton pore of ATP synthase -> increases proton gradient -> stops electron transport via respiratory control.',
      '2,4-Dinitrophenol (DNP) and Thermogenin (UCP1) are uncouplers: they puncture holes in the inner membrane, collapsing the proton gradient into pure heat without making ATP.'
    ],
    tags: ['Biochemistry', 'Metabolism', 'Mitochondria', 'Enzymology', 'MCAT'],
    quiz: [
      {
        id: 'q-cr-1',
        lectureId: 'lec-cellular-respiration',
        topic: 'Metabolism & Bioenergetics',
        question: 'If a patient is poisoned with 2,4-Dinitrophenol (DNP), an uncoupler of oxidative phosphorylation, what clinical and metabolic pattern will you observe?',
        options: [
          'Low body temperature, decreased oxygen consumption, high ATP production',
          'Severe hyperthermia, increased oxygen consumption, rapid ATP depletion',
          'Elevated ATP production with complete cessation of Krebs cycle activity',
          'Metabolic alkalosis due to excessive bicarbonate generation in mitochondria'
        ],
        correctIndex: 1,
        angryExplanation: 'DNP is a lipid-soluble proton shuttle. It carries H+ across the inner mitochondrial membrane, dissipating the proton gradient as raw thermal energy (heat). The ETC runs at maximum overdrive trying to rebuild the broken dam, consuming massive oxygen, but zero ATP is made!',
        examinerTrapNotes: 'Notice: Oxygen consumption goes UP with uncouplers, but DOWN with ETC inhibitors (cyanide, rotenone, antimycin).'
      },
      {
        id: 'q-cr-2',
        lectureId: 'lec-cellular-respiration',
        topic: 'Metabolism & Bioenergetics',
        question: 'Where do the carbon atoms in the CO2 that humans exhale during expiration actually originate from?',
        options: [
          'From inhaled atmospheric O2 reacting directly with dietary carbohydrates in the lungs',
          'From the cleavage of carboxyl groups during pyruvate decarboxylation and the citric acid cycle',
          'From the breakdown of water molecules during ATP hydrolysis in skeletal muscle',
          'From lactic acid fermentation occurring in anaerobic red blood cells'
        ],
        correctIndex: 1,
        angryExplanation: 'Carboxyl groups from pyruvate and isocitrate/alpha-ketoglutarate! The oxygen you inhale becomes the oxygen atom in water (H2O) at Complex IV. Inhaled oxygen NEVER becomes the oxygen in CO2!',
        examinerTrapNotes: 'Every first-year biology student fails this because high school diagrams draw O2 going in and CO2 coming out like a car exhaust.'
      }
    ],
    vivaQuestions: [
      {
        id: 'viva-cr-1',
        topic: 'Metabolism & Bioenergetics',
        title: 'Speaking Exam: Cyanide vs. Carbon Monoxide vs. Uncoupling',
        difficulty: 'Savage',
        examinerPrompt: 'Candidate, tell me precisely how you differentiate Cyanide toxicity from Carbon Monoxide poisoning in a comatose patient found in a burning building. Explain the biochemical mechanism at Complex IV and state what the venous oxygen saturation (SvO2) will be in each.',
        requiredKeywords: ['Fe3+ in Cytochrome c oxidase', 'carboxyhemoglobin', 'arterial pO2 normal', 'elevated venous oxygen saturation (SvO2)', 'bright red venous blood'],
        sampleModelAnswer: 'Both poisons disrupt cellular respiration, but at distinct biological loci. Carbon Monoxide binds hemoglobin Fe2+ with 200x greater affinity than O2, shifting the oxyhemoglobin curve left and decreasing tissue delivery, yielding elevated carboxyhemoglobin on co-oximetry and low SvO2. Cyanide binds ferric iron (Fe3+) in Cytochrome c oxidase (Complex IV) of the inner mitochondrial membrane, completely halting the transfer of electrons to O2. Consequently, cells cannot utilize the oxygen delivered to them, resulting in high venous oxygen saturation (arterialization of venous blood, bright red venous blood), normal carboxyhemoglobin, and severe lactic acidosis due to anaerobic glycolysis.',
        followUpPrompt: 'What is the immediate antidote mechanism using hydroxocobalamin versus amyl nitrite?'
      }
    ]
  },
  {
    id: 'lec-acid-base-bohr',
    title: 'Acid-Base Blood Gas & The Oxyhemoglobin Curve (Bohr Effect)',
    topic: 'Respiratory & Acid-Base Physiology',
    difficulty: 'Brutal Exam Level',
    youtubeUrl: 'https://www.youtube.com/watch?v=u_t0xXg1a3g',
    youtubeId: 'u_t0xXg1a3g',
    duration: '16 min',
    summary: 'The red blood cell has no loyalty. When tissue is working hard—producing heat, acid, and CO2—hemoglobin drops its oxygen like a hot potato. Stop memorizing right vs left shifts without understanding the allosteric T-to-R transition.',
    theTrap: 'Do not confuse oxygen affinity with oxygen carrying capacity! Carbon monoxide decreases carrying capacity and increases affinity (left shift). Anemia decreases carrying capacity but leaves affinity (P50) completely normal! Examiners feast on this distinction every single year.',
    coreMechanism: [
      '1. T (Tense) State vs R (Relaxed) State: Deoxyhemoglobin is in the T state (low oxygen affinity, stabilized by salt bridges). When the first O2 binds to iron in the heme pocket, it pulls the proximal histidine, tilting the F-helix and snapping adjacent subunits into the high-affinity R state (positive cooperativity -> sigmoidal curve).',
      '2. The Bohr Effect: In exercising tissue, active metabolism produces CO2 + H2O <-> H2CO3 <-> H+ + HCO3- (via carbonic anhydrase). H+ ions protonate key histidine residues (His146), forming salt bridges that lock hemoglobin into the T state, forcing oxygen release.',
      '3. Right Shift (Decreased Affinity, High P50): CADET, face RIGHT! (CO2, Acid/H+, 2,3-DPG/BPG, Exercise, Temperature). A rightward shift means a higher partial pressure of O2 is required to achieve 50% saturation (P50 increases). Oxygen is unloaded easily to tissues.',
      '4. Left Shift (Increased Affinity, Low P50): Lower temp, alkalosis (low H+), low 2,3-BPG, fetal hemoglobin (HbF lacks positive charges to bind 2,3-BPG), carboxyhemoglobin, and methemoglobin. Oxygen is tightly hoarded and poorly unloaded.',
      '5. Haldane Effect: Oxygenation of blood in the lungs promotes dissociation of CO2 from hemoglobin, allowing CO2 to be exhaled.'
    ],
    analogy: 'Hemoglobin is an Uber driver. When the neighborhood is calm, air-conditioned, and pleasant (the lungs), he picks up 4 passengers and holds them tight. When he enters a burning, chaotic, acidic gym where everyone is screaming and throwing weights (exercising muscle), he slams on the brakes and kicks all passengers onto the pavement.',
    highYieldBullets: [
      'P50 of normal adult hemoglobin (HbA) is ~26.8 mmHg. A right shift increases P50 (e.g. to 35 mmHg); a left shift drops P50 (e.g. to 19 mmHg).',
      'Fetal Hemoglobin (HbF, alpha2-gamma2) has serine instead of histidine at position 143, eliminating positive charges that bind 2,3-BPG, giving HbF a higher O2 affinity than maternal HbA to extract oxygen across the placenta.',
      'Methemoglobinemia: Fe2+ (ferrous) oxidized to Fe3+ (ferric) by dapsone, nitrites, or benzocaine -> chocolate brown blood, normal PaO2 on arterial blood gas, pulse oximeter fixed at 85%.'
    ],
    tags: ['Respiratory', 'Acid-Base', 'Hematology', 'Physiology', 'USMLE'],
    quiz: [
      {
        id: 'q-bohr-1',
        lectureId: 'lec-acid-base-bohr',
        topic: 'Respiratory & Acid-Base Physiology',
        question: 'Which of the following conditions causes BOTH a decrease in blood oxygen carrying capacity AND a leftward shift of the oxyhemoglobin dissociation curve?',
        options: [
          'High altitude acclimatization with elevated 2,3-BPG',
          'Carbon monoxide poisoning',
          'Iron deficiency anemia with Hb 7.0 g/dL',
          'Severe septic shock with lactic acidosis and fever'
        ],
        correctIndex: 1,
        angryExplanation: 'Brilliant! Carbon monoxide occupies heme binding sites (reducing capacity), while simultaneously locking the remaining heme subunits into the high-affinity R state (left shift), preventing oxygen from jumping off into starving tissues.',
        examinerTrapNotes: 'Anemia reduces capacity but does NOT shift the curve left. Altitude shifts the curve right via 2,3-BPG.'
      },
      {
        id: 'q-bohr-2',
        lectureId: 'lec-acid-base-bohr',
        topic: 'Respiratory & Acid-Base Physiology',
        question: 'Why does Fetal Hemoglobin (HbF) possess a significantly higher oxygen affinity than maternal Adult Hemoglobin (HbA)?',
        options: [
          'HbF contains 6 heme pockets instead of 4',
          'The gamma chains of HbF replace positively charged histidine residues with neutral serine, reducing 2,3-BPG binding',
          'Fetal blood operates at a much higher core temperature than maternal blood',
          'The fetal lung actively manufactures carbonic anhydrase inhibitors'
        ],
        correctIndex: 1,
        angryExplanation: 'Exactly. 2,3-BPG is negatively charged and binds in the central cavity of the T state between positive histidine residues on beta chains. Gamma chains have neutral serine instead of histidine 143, so 2,3-BPG cannot bind and stabilize the T state.',
        examinerTrapNotes: 'Examiners adore asking about the gamma globin chain substitution. Memorize Serine 143.'
      }
    ],
    vivaQuestions: [
      {
        id: 'viva-bohr-1',
        topic: 'Respiratory & Acid-Base Physiology',
        title: 'Speaking Exam: The Pulse Oximeter Deception',
        difficulty: 'Savage',
        examinerPrompt: 'A patient presents cyanotic and dyspneic after using a topical benzocaine spray for a toothache. The bedside pulse oximeter reads exactly 85% on room air and stays at 85% on 100% non-rebreather oxygen. The blood drawn looks chocolate brown. Explain the molecular pathology, why the pulse ox is frozen at 85%, and describe the exact chemical reduction mechanism of the treatment.',
        requiredKeywords: ['methemoglobin', 'Fe3+ ferric state', 'absorbance ratio 660nm and 940nm equals 1.0', 'methylene blue', 'NADPH methemoglobin reductase'],
        sampleModelAnswer: 'The patient has acquired methemoglobinemia from benzocaine oxidation of heme iron from Fe2+ (ferrous) to Fe3+ (ferric). Fe3+ cannot bind oxygen, and it allosterically increases the affinity of the remaining Fe2+ hemes, shifting the curve left and suffocating tissues. Pulse oximeters measure absorbance at 660nm (deoxyhemoglobin) and 940nm (oxyhemoglobin); methemoglobin has equal high absorbance at both wavelengths, producing a 1:1 absorbance ratio that the device microprocessor is calibrated to read as 85%. Arterial PaO2 is completely normal because dissolved oxygen in plasma is unaffected. Treatment is intravenous methylene blue, which acts as an electron acceptor from NADPH via NADPH methemoglobin reductase, reducing methylene blue to leukomethylene blue, which non-enzymatically reduces Fe3+ back to Fe2+.',
        followUpPrompt: 'Why would methylene blue cause fatal hemolysis if this patient had an underlying G6PD deficiency?'
      }
    ]
  },
  {
    id: 'lec-renal-raas',
    title: 'Renal Clearance, Countercurrent Multiplier & The RAAS Axis',
    topic: 'Renal Physiology',
    difficulty: 'High-Yield',
    youtubeUrl: 'https://www.youtube.com/watch?v=bY6446Qki1U',
    youtubeId: 'bY6446Qki1U',
    duration: '20 min',
    summary: 'The kidney is the most pedantic accountant in your body. It spends enormous metabolic energy establishing a 1200 mOsm/kg medullary gradient in the Loop of Henle just so ADH can open water channels at the very end to save you from turning into a dried prune.',
    theTrap: 'Never confuse Aldosterone with Vasopressin (ADH)! Aldosterone acts on principal cells to reabsorb Na+ and secrete K+/H+ (isotonic reabsorption, blood sodium concentration does not change!). ADH acts on V2 receptors to insert Aquaporin-2 channels, absorbing PURE FREE WATER (lowers serum osmolarity and sodium concentration!).',
    coreMechanism: [
      '1. Glomerular Filtration Barrier: Podocyte foot processes, basement membrane (heparan sulfate negative charge repelling albumin), and fenestrated endothelium filter 125 mL/min (GFR).',
      '2. Proximal Convoluted Tubule (PCT): The heavy lifter—reabsorbs 65-70% of filtered Na+, H2O, and 100% of glucose and amino acids via Na+-glucose cotransporters (SGLT2). Carbonic anhydrase reabsorbs HCO3-.',
      '3. Countercurrent Multiplier: Descending limb is permeable to water (concentrates tubular fluid up to 1200 mOsm at hairpin). Thick ascending limb (TAL) is IMPERMEABLE to water and actively pumps ions via the Na+/K+/2Cl- cotransporter (NKCC2), building the hyperosmotic renal medullary interstitium.',
      '4. Distal Convoluted Tubule (DCT): Reabsorbs 5% Na+ and Cl- via the NCC cotransporter (blocked by thiazide diuretics). Parathyroid hormone (PTH) stimulates Ca2+ reabsorption here.',
      '5. Collecting Duct & RAAS: Low renal perfusion pressure or high sympathetic tone causes juxtaglomerular (JG) cells to release Renin -> converts Angiotensinogen to Angiotensin I -> ACE in pulmonary endothelium converts to Angiotensin II -> stimulates Ang II receptors (vasoconstricts efferent arterioles to preserve GFR) and triggers Aldosterone secretion from adrenal zona glomerulosa.'
    ],
    analogy: 'The loop of Henle is a salt refinery. The ascending limb is a security guard pumping salt out into the yard while locking all the windows (no water allowed out). The descending limb is next door with open windows; because the yard is full of salt, all the water leaks out into the yard.',
    highYieldBullets: [
      'Loop diuretics (furosemide) inhibit NKCC2 in the thick ascending limb, abolishing the medullary concentration gradient so the collecting duct cannot concentrate urine even with maximum ADH.',
      'Inulin clearance equals GFR exactly because it is freely filtered, neither reabsorbed nor secreted. Creatinine slightly overestimates GFR because a small fraction is actively secreted by proximal tubules.',
      'ACE inhibitors preferentially dilate the EFFERENT arteriole (blocking Ang II), which reduces glomerular capillary hydrostatic pressure, reducing proteinuria in diabetic nephropathy.'
    ],
    tags: ['Renal', 'Nephrology', 'Diuretics', 'USMLE Step 1', 'Physiology'],
    quiz: [
      {
        id: 'q-renal-1',
        lectureId: 'lec-renal-raas',
        topic: 'Renal Physiology',
        question: 'A patient with severe bilateral renal artery stenosis is started on an ACE inhibitor. Within 48 hours, their serum creatinine jumps from 1.1 to 3.8 mg/dL. What physiological mechanism explains this acute decline in GFR?',
        options: [
          'Direct acute tubular necrosis caused by drug toxicity in the proximal tubule',
          'Preferential dilation of the efferent arteriole, collapsing glomerular hydrostatic filtration pressure',
          'Constriction of the afferent arteriole mediated by excessive tubuloglomerular feedback',
          'Inhibition of the NKCC2 symporter in the thick ascending loop of Henle'
        ],
        correctIndex: 1,
        angryExplanation: 'Angiotensin II selectively vasoconstricts the efferent arteriole to maintain high glomerular hydrostatic pressure when afferent inflow is choked off by stenosis. Take away Ang II with an ACE inhibitor, the efferent arteriole swings wide open, filtration pressure collapses, and GFR plummets!',
        examinerTrapNotes: 'A classic clinical board question. Remember: NSAIDs constrict the afferent arteriole (block prostaglandins); ACE inhibitors dilate the efferent arteriole.'
      }
    ],
    vivaQuestions: [
      {
        id: 'viva-renal-1',
        topic: 'Renal Physiology',
        title: 'Speaking Exam: Inulin vs PAH Clearance',
        difficulty: 'Strict',
        examinerPrompt: 'Candidate, explain why Para-aminohippuric acid (PAH) clearance is used to estimate Renal Plasma Flow (RPF), while Inulin clearance estimates GFR. At high plasma concentrations of PAH, what happens to the calculated clearance value and why?',
        requiredKeywords: ['filtration and secretion', 'transport maximum (Tm)', 'saturation of organic anion transporters', 'underestimation at high concentrations'],
        sampleModelAnswer: 'Inulin is freely filtered at the glomerulus and is neither reabsorbed nor secreted by the nephron tubules, meaning the rate of excretion equals the rate of filtration: Clearance = (U_inulin * V) / P_inulin = GFR. In contrast, PAH is both freely filtered (~20%) and almost completely secreted by organic anion transporters (OAT1/OAT3) in the proximal tubule (~80%), resulting in near-total extraction from renal arterial plasma in a single pass (~90%), making its clearance representative of Effective Renal Plasma Flow (eRPF). However, tubule secretion is a carrier-mediated active process with a finite transport maximum (Tm). At supra-physiological plasma PAH concentrations, transporters saturate; additional PAH cannot be secreted and is merely filtered, causing the calculated clearance of PAH to asymptotically decrease toward GFR.',
        followUpPrompt: 'How would you calculate Renal Blood Flow (RBF) from RPF if the patient has a hematocrit of 45%?'
      }
    ]
  },
  {
    id: 'lec-cardio-starling',
    title: 'Frank-Starling Law & Pressure-Volume Loops',
    topic: 'Cardiovascular Dynamics',
    difficulty: 'High-Yield',
    youtubeUrl: 'https://www.youtube.com/watch?v=xK748q4K2f4',
    youtubeId: 'xK748q4K2f4',
    duration: '17 min',
    summary: 'Your heart is not an engine with a gas pedal; it is a spring-loaded muscle whose stroke volume is strictly determined by how much blood stretches it before contraction. Master PV loops once and you can diagnose any valve disease in 5 seconds.',
    theTrap: 'Never confuse an inotropic shift (contractility) with a preload shift on the Frank-Starling curve! Increased preload moves you rightward along the SAME curve. Increased inotropy (e.g. epinephrine, digoxin) lifts the ENTIRE curve upward, generating higher stroke volume at any given end-diastolic volume!',
    coreMechanism: [
      '1. The Frank-Starling Mechanism: Greater venous return -> increased End-Diastolic Volume (EDV, Preload) -> stretches ventricular sarcomeres toward optimal myofilament overlap (2.0 - 2.2 um) and increases troponin C sensitivity to Ca2+ -> increased stroke volume (SV).',
      '2. PV Loop Phase 1 (Ventricular Filling): Mitral valve opens -> ventricle fills from End-Systolic Volume (ESV, ~50 mL) to End-Diastolic Volume (EDV, ~120 mL) along the compliant diastolic curve.',
      '3. PV Loop Phase 2 (Isovolumetric Contraction): Mitral valve snaps shut (S1 sound). Ventricle contracts with all valves closed; pressure spikes vertically from 10 mmHg to 80 mmHg (aortic diastolic pressure) with zero change in volume.',
      '4. PV Loop Phase 3 (Ventricular Ejection): Aortic valve swings open. Blood ejects into the aorta up to peak systolic pressure (~120 mmHg) down to ESV.',
      '5. PV Loop Phase 4 (Isovolumetric Relaxation): Aortic valve snaps shut (S2 sound). Ventricle relaxes with all valves closed; pressure drops vertically from 100 mmHg back to 10 mmHg.',
      '6. Stroke Volume & Ejection Fraction: SV = EDV - ESV (the width of the PV loop). EF = SV / EDV (normally 55-70%). The area inside the loop equals stroke work.'
    ],
    analogy: 'Sarcomeres are like a bow and arrow. If you barely pull the string back (low preload/EDV), the arrow dribbles onto your toes. If you pull it back fully to the sweet spot (optimal actin-myosin overlap), the arrow fires across the valley with maximum kinetic energy.',
    highYieldBullets: [
      'Aortic Stenosis: Massive systolic pressure spike inside the ventricle (>200 mmHg) with narrow ejection width (high afterload, low stroke volume), concentric LV hypertrophy.',
      'Mitral Regurgitation: No true isovolumetric phases! Blood immediately leaks backward into the low-pressure left atrium as soon as systole starts.',
      'Aortic Regurgitation: No isovolumetric relaxation; blood leaks back from the aorta during diastole, causing enormous EDV (huge loop width) and a hyperdynamic bounding pulse (wide pulse pressure).'
    ],
    tags: ['Cardiovascular', 'Hemodynamics', 'Pathology', 'USMLE', 'Physiology'],
    quiz: [
      {
        id: 'q-cv-1',
        lectureId: 'lec-cardio-starling',
        topic: 'Cardiovascular Dynamics',
        question: 'Which of the following cardiovascular pathologies completely eliminates BOTH isovolumetric contraction and isovolumetric relaxation phases on a Left Ventricular Pressure-Volume loop?',
        options: [
          'Aortic valve stenosis',
          'Mitral valve regurgitation',
          'Pure essential hypertension',
          'Hypertrophic obstructive cardiomyopathy'
        ],
        correctIndex: 1,
        angryExplanation: 'Spot on! Isovolumetric phases require all valves to be firmly closed so volume remains constant while pressure shifts. In mitral regurgitation, the incompetent mitral valve lets blood leak backward into the left atrium the instant pressure rises, so volume is NEVER constant!',
        examinerTrapNotes: 'A classic board examination trap. Look for rounded, diamond-like PV loops with lost vertical sides.'
      }
    ],
    vivaQuestions: [
      {
        id: 'viva-cv-1',
        topic: 'Cardiovascular Dynamics',
        title: 'Speaking Exam: Preload vs Afterload vs Inotropy',
        difficulty: 'Strict',
        examinerPrompt: 'Candidate, draw and explain the morphological changes on an LV Pressure-Volume loop when you administer an intravenous pure alpha-1 adrenergic agonist (phenylephrine) versus an intravenous pure beta-1 adrenergic agonist (dobutamine).',
        requiredKeywords: ['increased systemic vascular resistance', 'increased afterload', 'decreased stroke volume', 'increased inotropy', 'ESPVR shift to the left'],
        sampleModelAnswer: 'Phenylephrine is a selective alpha-1 agonist that causes intense peripheral arteriolar vasoconstriction, dramatically increasing systemic vascular resistance and afterload. On the PV loop, the aortic valve opening pressure rises, peak systolic pressure increases, and the ejection phase terminates early at a higher End-Systolic Volume (ESV), narrowing the loop width (decreased stroke volume). In contrast, dobutamine is a selective beta-1 agonist that increases cyclic AMP and protein kinase A phosphorylation of L-type Ca2+ channels and phospholamban, enhancing inotropy. On the PV loop, this shifts the End-Systolic Pressure-Volume Relationship (ESPVR) line steeply to the left: ESV decreases, stroke volume (loop width) increases, and ejection fraction improves without necessarily raising afterload.',
        followUpPrompt: 'What happens to myocardial oxygen consumption (MVO2) in both scenarios?'
      }
    ]
  },
  {
    id: 'lec-enzyme-kinetics',
    title: 'Enzyme Kinetics & Lineweaver-Burk Roasts',
    topic: 'Enzymology & Pharmacology',
    difficulty: 'High-Yield',
    youtubeUrl: 'https://www.youtube.com/watch?v=7uJ63FvdX7g',
    youtubeId: '7uJ63FvdX7g',
    duration: '15 min',
    summary: 'Lineweaver-Burk plots are just high school algebra (y = mx + b) turned upside down to make simple concepts look terrifying. Km is your enzyme’s grip strength; Vmax is the physical speed limit of the machinery.',
    theTrap: 'Never forget that Lineweaver-Burk plots plot 1/V on the y-axis and 1/[S] on the x-axis! Because they are inverse fractions, a LARGER Vmax moves the y-intercept CLOSER to the zero origin (downward). A tighter affinity (lower Km) moves the negative x-intercept FURTHER to the left away from zero!',
    coreMechanism: [
      '1. Michaelis-Menten Equation: v = (Vmax * [S]) / (Km + [S]). When [S] << Km, velocity is first-order linear. When [S] >> Km, all active sites are saturated and velocity is zero-order constant (Vmax).',
      '2. Km (Michaelis Constant): The substrate concentration at which reaction velocity is exactly half of Vmax. Inversely proportional to enzyme-substrate affinity under rapid equilibrium assumptions.',
      '3. Lineweaver-Burk Double Reciprocal: 1/v = (Km / Vmax)(1/[S]) + (1/Vmax). Slope = Km/Vmax. Y-intercept = 1/Vmax. X-intercept = -1/Km.',
      '4. Competitive Inhibition: Inhibitor binds to the catalytic ACTIVE site, competing directly with substrate. Overcome by adding huge excess substrate. Vmax is UNCHANGED. Km is INCREASED (apparent affinity decreases). On Lineweaver-Burk: same y-intercept, x-intercept shifts closer to zero (steeper slope).',
      '5. Non-Competitive (Allosteric) Inhibition: Inhibitor binds to an allosteric site regardless of whether substrate is bound. Cannot be overcome by flooding substrate. Vmax is DECREASED. Km is UNCHANGED. On Lineweaver-Burk: y-intercept shifts upward, same x-intercept.',
      '6. Uncompetitive Inhibition: Inhibitor binds ONLY to the pre-formed Enzyme-Substrate (ES) complex. Both Vmax and Km decrease by the exact same ratio, producing PARALLEL lines on Lineweaver-Burk.'
    ],
    analogy: 'Imagine a hot dog eating champion. A competitive inhibitor is a clown standing in front of him slapping hot dogs out of his hand; if you dump 10,000 hot dogs on the table, the champion can ignore the clown and still eat at his maximum world-record speed (same Vmax). A non-competitive inhibitor punches the champion in the stomach; no matter how many hot dogs you put in front of him, his stomach capacity is halved (reduced Vmax).',
    highYieldBullets: [
      'Competitive: Statins (HMG-CoA reductase inhibitors), Methotrexate (dihydrofolate reductase inhibitor), ACE inhibitors.',
      'Non-competitive: Lead poisoning (ferrochelatase and ALA dehydratase inhibition), heavy metals.',
      'Irreversible: Aspirin (covalent acetylation of COX-1/2), organophosphates (acetylcholinesterase).'
    ],
    tags: ['Biochemistry', 'Pharmacology', 'Enzyme Kinetics', 'MCAT', 'USMLE'],
    quiz: [
      {
        id: 'q-enz-1',
        lectureId: 'lec-enzyme-kinetics',
        topic: 'Enzymology & Pharmacology',
        question: 'On a Lineweaver-Burk double reciprocal plot, you observe that in the presence of an experimental inhibitor, the line pivots around the EXACT same x-intercept as the uninhibited enzyme, but has a steeper slope and higher y-intercept. What type of inhibition is this?',
        options: [
          'Competitive reversible inhibition',
          'Pure non-competitive inhibition',
          'Uncompetitive inhibition',
          'Substrate-level feedback activation'
        ],
        correctIndex: 1,
        angryExplanation: 'Pure non-competitive inhibition! The x-intercept is -1/Km; since the line passes through the exact same x-intercept, Km is unchanged. The higher y-intercept (1/Vmax) reflects a lower Vmax.',
        examinerTrapNotes: 'Competitive inhibition crosses at the Y-intercept! Non-competitive crosses at the X-intercept. Do not invert them in your head.'
      }
    ],
    vivaQuestions: [
      {
        id: 'viva-enz-1',
        topic: 'Enzymology & Pharmacology',
        title: 'Speaking Exam: Methotrexate vs Heavy Metal Poisoning',
        difficulty: 'Strict',
        examinerPrompt: 'Candidate, compare the kinetic parameters (Km, Vmax, kcat, catalytic efficiency) of dihydrofolate reductase treated with Methotrexate versus ferrochelatase treated with Lead. How do you rescue the patient biochemically in each scenario?',
        requiredKeywords: ['competitive vs non-competitive', 'Km increased, Vmax unchanged', 'Vmax decreased, Km unchanged', 'leucovorin rescue (folinic acid)', 'chelation with dimercaprol / EDTA'],
        sampleModelAnswer: 'Methotrexate is a structural analog of folic acid and acts as a competitive reversible inhibitor of dihydrofolate reductase (DHFR). It increases apparent Km while leaving Vmax unchanged, thereby reducing kcat/Km catalytic efficiency at physiological substrate levels. It can be overcome by administering high doses of Leucovorin (folinic acid, N5-formyl-THF), which bypasses DHFR entirely to replenish downstream tetrahydrofolate pools. In contrast, Lead (Pb2+) is a heavy metal that causes irreversible non-competitive inhibition by binding to sulfhydryl (-SH) groups on ferrochelatase and delta-aminolevulinic acid dehydratase in heme synthesis. This denatures the catalytic geometry, depressing Vmax and kcat permanently regardless of substrate concentration, leaving Km unchanged. Treatment requires chemical chelation using dimercaprol (BAL), calcium disodium EDTA, or succimer (DMSA) to remove the metal from protein thiols.',
        followUpPrompt: 'Explain how uncompetitive inhibition affects the Lineweaver-Burk slope and why parallel lines emerge.'
      }
    ]
  }
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    topic: 'Electrophysiology',
    front: 'What structural component causes the absolute refractory period in voltage-gated Na+ channels?',
    back: 'The intracellular ball-and-chain inactivation gate (IFM motif) plugs the channel vestibule at +30mV. It remains plugged until the membrane repolarizes below threshold.',
    trap: 'Do not say "the channel closes". Closing is the m-gate; plugging is the h-inactivation gate.',
    box: 1,
    nextReviewDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'fc-2',
    topic: 'Metabolism',
    front: 'What is the exact biological fate of the oxygen atoms in inhaled O2 molecules during aerobic respiration?',
    back: 'They serve as the terminal electron acceptor at Complex IV (Cytochrome c oxidase) and are reduced into metabolic water (H2O).',
    trap: 'They do NOT become the oxygen in exhaled CO2!',
    box: 2,
    nextReviewDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'fc-3',
    topic: 'Respiratory',
    front: 'State the CADET mnemonic for the Oxyhemoglobin Dissociation Curve.',
    back: 'CADET face RIGHT: CO2, Acid (H+), 2,3-DPG (BPG), Exercise, Temperature. All shift the curve right (decreased affinity, increased P50, enhanced tissue unloading).',
    trap: 'Right shift = easier to unload to tissues, harder to saturate in the lungs.',
    box: 1,
    nextReviewDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'fc-4',
    topic: 'Renal',
    front: 'What is the precise physiological difference between Aldosterone and Vasopressin (ADH)?',
    back: 'Aldosterone reabsorbs Na+ and excretes K+/H+ (isotonic volume expansion, unchanged serum sodium). ADH inserts Aquaporin-2 in collecting ducts to reabsorb pure free water (lowers serum osmolarity and serum sodium).',
    trap: 'Never say aldosterone dilutes the blood; it moves salt AND water isosmotically.',
    box: 1,
    nextReviewDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'fc-5',
    topic: 'Cardiovascular',
    front: 'Why are there no isovolumetric contraction or relaxation phases in Mitral Regurgitation?',
    back: 'Because the incompetent mitral valve leaks blood backward into the low-pressure left atrium as soon as ventricular pressure rises, preventing constant volume.',
    trap: 'Isovolumetric phases require ALL heart valves to remain strictly closed.',
    box: 3,
    nextReviewDate: new Date().toISOString().split('T')[0]
  },
  {
    id: 'fc-6',
    topic: 'Enzymology',
    front: 'How do you distinguish competitive from non-competitive inhibition on a Lineweaver-Burk plot?',
    back: 'Competitive: lines cross at the same Y-intercept (same Vmax, steeper slope, shifted X-intercept). Non-competitive: lines cross at the same X-intercept (same Km, higher Y-intercept).',
    trap: 'Remember the axes are 1/v and 1/[S]. Higher Y-intercept = LOWER Vmax!',
    box: 2,
    nextReviewDate: new Date().toISOString().split('T')[0]
  }
];

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../db');

const questions = [
  {
    question_type: 'multiple_choice',
    anatomical_system: 'Skeletal',
    difficulty: 'easy',
    question_text: 'Which bone is the longest in the human body?',
    image_url: null,
    explanation: 'The femur, or thigh bone, is the longest and strongest bone in the human body, extending from the hip to the knee.',
    options: [
      { label: 'A', option_text: 'Femur', is_correct: true },
      { label: 'B', option_text: 'Tibia', is_correct: false },
      { label: 'C', option_text: 'Humerus', is_correct: false },
      { label: 'D', option_text: 'Fibula', is_correct: false },
    ],
  },
  {
    question_type: 'multiple_choice',
    anatomical_system: 'Muscular',
    difficulty: 'medium',
    question_text: 'Which muscle is the primary driver of knee extension?',
    image_url: null,
    explanation: 'The rectus femoris, part of the quadriceps femoris group, crosses both the hip and knee joints and is the primary muscle responsible for knee extension.',
    options: [
      { label: 'A', option_text: 'Rectus femoris', is_correct: true },
      { label: 'B', option_text: 'Biceps femoris', is_correct: false },
      { label: 'C', option_text: 'Gastrocnemius', is_correct: false },
      { label: 'D', option_text: 'Sartorius', is_correct: false },
    ],
  },
  {
    question_type: 'multiple_choice',
    anatomical_system: 'Cardiovascular',
    difficulty: 'hard',
    question_text: 'What is the correct sequence of blood flow through the right side of the heart?',
    image_url: null,
    explanation: 'Deoxygenated blood enters the right atrium, passes through the tricuspid valve into the right ventricle, then exits through the pulmonary (semilunar) valve into the pulmonary artery towards the lungs.',
    options: [
      { label: 'A', option_text: 'Right atrium → tricuspid valve → right ventricle → pulmonary valve → pulmonary artery', is_correct: true },
      { label: 'B', option_text: 'Right ventricle → right atrium → tricuspid valve → pulmonary artery', is_correct: false },
      { label: 'C', option_text: 'Right atrium → mitral valve → right ventricle → aortic valve → aorta', is_correct: false },
      { label: 'D', option_text: 'Right atrium → pulmonary veins → right ventricle → pulmonary trunk', is_correct: false },
    ],
  },
  {
    question_type: 'multiple_choice',
    anatomical_system: 'Nervous',
    difficulty: 'medium',
    question_text: 'Which neurotransmitter is released at the neuromuscular junction to initiate muscle contraction?',
    image_url: null,
    explanation: 'Acetylcholine (ACh) is released by motor neurons at the neuromuscular junction, binding to nicotinic receptors on the motor end plate and triggering an action potential in the muscle fiber.',
    options: [
      { label: 'A', option_text: 'Acetylcholine', is_correct: true },
      { label: 'B', option_text: 'Dopamine', is_correct: false },
      { label: 'C', option_text: 'Serotonin', is_correct: false },
      { label: 'D', option_text: 'GABA', is_correct: false },
    ],
  },
  {
    question_type: 'identify_part',
    anatomical_system: 'Skeletal',
    difficulty: 'easy',
    question_text: 'The image shows an anterior view of the human skull. Identify the bone that forms the forehead and the superior orbital margins.',
    image_url: 'https://placehold.co/480x320/1e3a5f/white?text=Anterior+Skull+View%0A(Frontal+%2F+Parietal+%2F+Temporal+%2F+Occipital)',
    explanation: 'The frontal bone forms the forehead (squamous part), the roof of the orbits (orbital part), and the anterior floor of the cranial cavity.',
    options: [
      { label: 'A', option_text: 'Frontal bone', is_correct: true },
      { label: 'B', option_text: 'Parietal bone', is_correct: false },
      { label: 'C', option_text: 'Temporal bone', is_correct: false },
      { label: 'D', option_text: 'Occipital bone', is_correct: false },
    ],
  },
  {
    question_type: 'identify_part',
    anatomical_system: 'Muscular',
    difficulty: 'medium',
    question_text: 'This posterior view of the lower leg shows the superficial calf musculature. Identify the large, two-headed muscle forming the bulk of the calf.',
    image_url: 'https://placehold.co/480x320/2d4a1e/white?text=Posterior+Lower+Leg%0A(Gastrocnemius+%2F+Soleus+%2F+Plantaris)',
    explanation: 'The gastrocnemius is the most superficial calf muscle, with two heads (medial and lateral) arising from the femoral condyles. It plantarflexes the foot and assists in knee flexion.',
    options: [
      { label: 'A', option_text: 'Gastrocnemius', is_correct: true },
      { label: 'B', option_text: 'Soleus', is_correct: false },
      { label: 'C', option_text: 'Popliteus', is_correct: false },
      { label: 'D', option_text: 'Plantaris', is_correct: false },
    ],
  },
  {
    question_type: 'identify_part',
    anatomical_system: 'Cardiovascular',
    difficulty: 'hard',
    question_text: 'This anterior diagram of the heart labels several major vessels. Identify the large elastic artery arising from the left ventricle that carries oxygenated blood to the systemic circulation.',
    image_url: 'https://placehold.co/480x320/4a1e3a/white?text=Heart+Anterior+View%0A(Aorta+%2F+Pulmonary+Trunk+%2F+SVC+%2F+Coronary+Aa.)',
    explanation: 'The aorta is the largest artery in the body. It arises from the left ventricle, passes through the aortic (semilunar) valve, arches superiorly, and descends to supply all systemic organs.',
    options: [
      { label: 'A', option_text: 'Aorta', is_correct: true },
      { label: 'B', option_text: 'Pulmonary trunk', is_correct: false },
      { label: 'C', option_text: 'Superior vena cava', is_correct: false },
      { label: 'D', option_text: 'Left coronary artery', is_correct: false },
    ],
  },
  {
    question_type: 'identify_part',
    anatomical_system: 'Nervous',
    difficulty: 'medium',
    question_text: 'This cross-section of the spinal cord highlights a central, fluid-filled channel running the entire length of the cord. Identify this structure.',
    image_url: 'https://placehold.co/480x320/1e3a4a/white?text=Spinal+Cord+Cross-Section%0A(Central+Canal+%2F+Gray+Matter+%2F+White+Matter)',
    explanation: 'The central canal is a small ependyma-lined channel at the center of the spinal cord, continuous with the fourth ventricle superiorly and filled with cerebrospinal fluid.',
    options: [
      { label: 'A', option_text: 'Central canal', is_correct: true },
      { label: 'B', option_text: 'Gray commissure', is_correct: false },
      { label: 'C', option_text: 'Dorsal horn', is_correct: false },
      { label: 'D', option_text: 'Ventral horn', is_correct: false },
    ],
  },
  {
    question_type: 'clinical_scenario',
    anatomical_system: 'Skeletal',
    difficulty: 'hard',
    question_text: 'A 70-year-old woman with known osteoporosis slips on ice and falls on her outstretched hand. She presents with wrist pain and swelling. X-ray reveals a fracture of the distal radius with dorsal displacement and angulation of the distal fragment. What is the most likely diagnosis?',
    image_url: null,
    explanation: "A Colles' fracture is a distal radius fracture with dorsal (posterior) displacement and angulation of the distal fragment, producing the classic 'dinner fork' deformity. It is the most common fracture in postmenopausal women with osteoporosis caused by a FOOSH (fall on outstretched hand) mechanism.",
    options: [
      { label: 'A', option_text: "Colles' fracture", is_correct: true },
      { label: 'B', option_text: "Smith's fracture", is_correct: false },
      { label: 'C', option_text: "Barton's fracture", is_correct: false },
      { label: 'D', option_text: 'Scaphoid fracture', is_correct: false },
    ],
  },
  {
    question_type: 'clinical_scenario',
    anatomical_system: 'Muscular',
    difficulty: 'medium',
    question_text: 'A 26-year-old sprinter feels a sudden sharp pop in his posterior thigh during a 100 m race. He collapses and cannot fully extend his knee against resistance. MRI confirms a complete proximal tear. Which muscle is most commonly involved in this type of injury?',
    image_url: null,
    explanation: 'The biceps femoris (long head) is the most frequently torn hamstring muscle, especially at its proximal myotendinous junction during explosive sprint acceleration. It originates from the ischial tuberosity and flexes the knee while extending the hip.',
    options: [
      { label: 'A', option_text: 'Biceps femoris', is_correct: true },
      { label: 'B', option_text: 'Semimembranosus', is_correct: false },
      { label: 'C', option_text: 'Rectus femoris', is_correct: false },
      { label: 'D', option_text: 'Gracilis', is_correct: false },
    ],
  },
  {
    question_type: 'clinical_scenario',
    anatomical_system: 'Cardiovascular',
    difficulty: 'hard',
    question_text: 'A 58-year-old hypertensive male smoker presents to the ED with sudden, severe, tearing chest pain radiating to the interscapular region. BP is 190/110 mmHg in the right arm and 155/90 mmHg in the left arm. CXR shows a widened mediastinum. What is the most likely diagnosis?',
    image_url: null,
    explanation: 'Aortic dissection presents with abrupt, tearing or ripping chest-to-back pain and is precipitated by hypertension. The blood pressure differential between arms occurs when the dissection flap involves the origin of the subclavian artery. A widened mediastinum on CXR is a classic finding.',
    options: [
      { label: 'A', option_text: 'Acute aortic dissection', is_correct: true },
      { label: 'B', option_text: 'ST-elevation myocardial infarction', is_correct: false },
      { label: 'C', option_text: 'Massive pulmonary embolism', is_correct: false },
      { label: 'D', option_text: 'Tension pneumothorax', is_correct: false },
    ],
  },
  {
    question_type: 'clinical_scenario',
    anatomical_system: 'Nervous',
    difficulty: 'hard',
    question_text: "A 52-year-old right-handed man suddenly develops weakness of the right face and right arm, and he cannot produce meaningful speech despite understanding questions (he answers 'yes' and 'no' incorrectly). Non-contrast CT head is negative for hemorrhage. Which arterial territory is most likely affected?",
    image_url: null,
    explanation: "The left middle cerebral artery (MCA) supplies Broca's area (inferior frontal gyrus) responsible for expressive speech, and the motor cortex controlling the contralateral (right) face and upper limb. Occlusion produces right hemiparesis with face and arm predominance plus non-fluent (Broca's) aphasia.",
    options: [
      { label: 'A', option_text: 'Left middle cerebral artery', is_correct: true },
      { label: 'B', option_text: 'Right middle cerebral artery', is_correct: false },
      { label: 'C', option_text: 'Left anterior cerebral artery', is_correct: false },
      { label: 'D', option_text: 'Basilar artery', is_correct: false },
    ],
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE session_answers, quiz_sessions, question_options, questions RESTART IDENTITY CASCADE');

    for (const q of questions) {
      const { rows } = await client.query(
        `INSERT INTO questions (question_type, anatomical_system, difficulty, question_text, image_url, explanation)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [q.question_type, q.anatomical_system, q.difficulty, q.question_text, q.image_url, q.explanation]
      );
      const questionId = rows[0].id;
      for (const opt of q.options) {
        await client.query(
          'INSERT INTO question_options (question_id, option_text, is_correct, label) VALUES ($1, $2, $3, $4)',
          [questionId, opt.option_text, opt.is_correct, opt.label]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Seeded ${questions.length} questions successfully.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();

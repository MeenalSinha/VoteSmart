const express = require('express');
const router = express.Router();

const simulationScenarios = {
  start: {
    id: 'start',
    scene: 'Polling Day Morning',
    narrative:
      'It is Election Day. You wake up at 7:30 AM. Your polling booth opens at 8:00 AM. You need to be prepared.',
    question: 'What is the first thing you do?',
    choices: [
      {
        id: 'check_docs',
        text: 'Check all required documents before leaving',
        nextId: 'docs_ready',
        score: 10,
        correct: true,
      },
      {
        id: 'rush_out',
        text: 'Rush out immediately to avoid queues',
        nextId: 'forgot_docs',
        score: 0,
      },
      {
        id: 'check_time',
        text: 'Check polling booth timings and location first',
        nextId: 'verified_booth',
        score: 8,
        correct: true,
      },
    ],
  },
  docs_ready: {
    id: 'docs_ready',
    scene: 'At the Polling Booth',
    narrative:
      'You arrive at the polling booth with all documents. There is a queue. An official checks your name in the voter list.',
    question: 'The official cannot find your name in their printed list. What do you do?',
    choices: [
      {
        id: 'show_eid',
        text: 'Show your Voter ID card and insist they check again',
        nextId: 'found_in_list',
        score: 10,
        correct: true,
      },
      {
        id: 'go_home',
        text: 'Assume you are not registered and go home',
        nextId: 'missed_vote',
        score: -5,
      },
      {
        id: 'ask_supervisor',
        text: 'Ask to speak with the Presiding Officer',
        nextId: 'supervisor_helps',
        score: 8,
        correct: true,
      },
    ],
  },
  forgot_docs: {
    id: 'forgot_docs',
    scene: 'At the Gate — No Documents',
    narrative:
      'You reach the polling booth but realize you forgot your Voter ID at home. The booth closes at 5:00 PM.',
    question: 'It is 9 AM. What is your best course of action?',
    choices: [
      {
        id: 'go_back',
        text: 'Return home, get your Voter ID, and come back',
        nextId: 'docs_ready',
        score: 7,
        correct: true,
      },
      {
        id: 'use_alt',
        text: 'Ask if alternative photo ID is accepted (e.g., Aadhaar, Passport)',
        nextId: 'alt_id_accepted',
        score: 10,
        correct: true,
      },
      {
        id: 'skip',
        text: 'Skip voting since you forgot your ID',
        nextId: 'missed_vote',
        score: -10,
      },
    ],
  },
  verified_booth: {
    id: 'verified_booth',
    scene: 'You Checked Your Booth Location',
    narrative:
      'You found your booth location using the Election Commission website. Your booth is at the local government school, 10 minutes away.',
    question: 'You arrive and see two queues. Which queue do you join?',
    choices: [
      {
        id: 'ask_queue',
        text: 'Ask an election official which queue is for your voter number',
        nextId: 'docs_ready',
        score: 10,
        correct: true,
      },
      {
        id: 'shorter_queue',
        text: 'Join whichever queue is shorter',
        nextId: 'wrong_queue',
        score: 2,
      },
      {
        id: 'read_notice',
        text: 'Read the notice board to find your voter number range',
        nextId: 'docs_ready',
        score: 9,
        correct: true,
      },
    ],
  },
  found_in_list: {
    id: 'found_in_list',
    scene: 'Inside the Voting Booth',
    narrative:
      'Your name was found after showing your Voter ID. You enter the voting compartment. You see the Electronic Voting Machine (EVM).',
    question: 'You accidentally press the wrong candidate button. What do you do?',
    choices: [
      {
        id: 'notify_officer',
        text: 'Immediately inform the Presiding Officer before the vote is confirmed',
        nextId: 'vote_cancelled',
        score: 10,
        correct: true,
      },
      {
        id: 'press_again',
        text: 'Try to press your intended candidate button again',
        nextId: 'double_vote_attempt',
        score: -5,
      },
      {
        id: 'leave_quietly',
        text: 'Leave quietly and hope no one notices',
        nextId: 'wrong_vote_cast',
        score: -8,
      },
    ],
  },
  supervisor_helps: {
    id: 'supervisor_helps',
    scene: 'Speaking with the Presiding Officer',
    narrative:
      'The Presiding Officer checks the Electoral Roll on the laptop. Your name appears in the supplementary list.',
    question:
      'You are verified. The officer hands you a ballot slip. What do you check before proceeding?',
    choices: [
      {
        id: 'verify_slip',
        text: 'Verify your name, voter number, and get the slip signed by the officer',
        nextId: 'found_in_list',
        score: 10,
        correct: true,
      },
      {
        id: 'just_proceed',
        text: 'Just proceed to the voting machine without checking',
        nextId: 'found_in_list',
        score: 5,
      },
    ],
  },
  alt_id_accepted: {
    id: 'alt_id_accepted',
    scene: 'Alternative ID Accepted',
    narrative:
      'The Election Commission allows 12 alternative photo ID documents including Aadhaar Card, Passport, Driving License, and PAN Card. Your Aadhaar is accepted.',
    question:
      'You are allowed inside. A stranger approaches and offers to help you vote. What do you do?',
    choices: [
      {
        id: 'refuse_help',
        text: 'Politely decline — voting is secret and personal',
        nextId: 'found_in_list',
        score: 10,
        correct: true,
      },
      {
        id: 'accept_help',
        text: 'Accept help since it is your first time',
        nextId: 'impersonation_risk',
        score: -8,
      },
    ],
  },
  missed_vote: {
    id: 'missed_vote',
    scene: 'Missed Opportunity',
    narrative:
      'You did not vote today. Your vote could have made a difference — in 2024, many constituencies were decided by fewer than 1,000 votes.',
    question: 'What will you do for the next election?',
    choices: [
      {
        id: 'register',
        text: 'Register on the Election Commission portal and set a reminder',
        nextId: 'final_lesson',
        score: 5,
        correct: true,
      },
      {
        id: 'give_up',
        text: 'Decide elections are not for you',
        nextId: 'final_lesson',
        score: -5,
      },
    ],
  },
  wrong_queue: {
    id: 'wrong_queue',
    scene: 'Wrong Queue',
    narrative:
      'After waiting 25 minutes, you reach the front and discover this queue is for voter numbers 1-500. Your number is 847.',
    question: 'You have lost some time. What now?',
    choices: [
      {
        id: 'find_right_queue',
        text: 'Find the correct queue for your voter number range',
        nextId: 'docs_ready',
        score: 7,
        correct: true,
      },
      {
        id: 'complain',
        text: 'Complain to the officer about the queue arrangement',
        nextId: 'docs_ready',
        score: 4,
      },
    ],
  },
  vote_cancelled: {
    id: 'vote_cancelled',
    scene: 'Vote Voided Correctly',
    narrative:
      'The Presiding Officer marks your ballot as void and issues you a fresh chance to vote. This is called a "tendered vote" procedure.',
    question: 'You now vote correctly. After voting, what do you check?',
    choices: [
      {
        id: 'check_vvpat',
        text: 'Check the VVPAT slip to verify your vote was recorded correctly',
        nextId: 'success',
        score: 10,
        correct: true,
      },
      {
        id: 'just_leave',
        text: 'Just leave, confident the machine worked correctly',
        nextId: 'success',
        score: 6,
      },
    ],
  },
  impersonation_risk: {
    id: 'impersonation_risk',
    scene: 'Warning: Electoral Fraud',
    narrative:
      'Allowing someone else to guide your vote or press on your behalf is a form of electoral fraud. It is also illegal under Section 171C of the Indian Penal Code.',
    question: 'You realize the mistake. What do you do?',
    choices: [
      {
        id: 'report',
        text: 'Report the individual to the Presiding Officer',
        nextId: 'success',
        score: 8,
        correct: true,
      },
      { id: 'stay_quiet', text: 'Stay quiet to avoid trouble', nextId: 'success', score: 2 },
    ],
  },
  double_vote_attempt: {
    id: 'double_vote_attempt',
    scene: 'EVM Lock — Vote Registered',
    narrative:
      'The EVM locks after a single vote. You cannot vote again on the same machine. Your accidental vote is now final.',
    question: 'What do you do next time to avoid this?',
    choices: [
      {
        id: 'take_time',
        text: 'Take 30 extra seconds to confirm your choice before pressing',
        nextId: 'final_lesson',
        score: 8,
        correct: true,
      },
      { id: 'blame_machine', text: 'Blame the EVM design', nextId: 'final_lesson', score: 1 },
    ],
  },
  wrong_vote_cast: {
    id: 'wrong_vote_cast',
    scene: 'Vote Cast Incorrectly',
    narrative:
      'Once a vote is registered on the EVM, it cannot be changed. This is why it is crucial to confirm your selection before pressing.',
    question: 'This is a hard lesson. What is your biggest takeaway?',
    choices: [
      {
        id: 'take_time',
        text: 'Always take your time, read all names carefully before pressing',
        nextId: 'final_lesson',
        score: 7,
        correct: true,
      },
    ],
  },
  final_lesson: {
    id: 'final_lesson',
    scene: 'Simulation Complete',
    narrative:
      'You have completed the voter simulation. Every election is a chance to practice democracy. Your vote counts.',
    question: null,
    choices: [],
    isEnd: true,
  },
  success: {
    id: 'success',
    scene: 'Vote Successfully Cast',
    narrative:
      'Congratulations! You have successfully cast your vote. You will receive an ink mark on your left index finger as proof. Your participation strengthens democracy.',
    question: null,
    choices: [],
    isEnd: true,
  },
};

router.get('/start', (req, res) => {
  res.json({ success: true, data: simulationScenarios.start });
});

router.post('/choice', (req, res) => {
  const { currentSceneId, choiceId } = req.body;

  if (!currentSceneId || !choiceId) {
    return res.status(400).json({ error: 'currentSceneId and choiceId are required' });
  }

  const currentScene = simulationScenarios[currentSceneId];
  if (!currentScene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  const choice = currentScene.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return res.status(404).json({ error: 'Choice not found' });
  }

  const nextScene = simulationScenarios[choice.nextId];
  if (!nextScene) {
    return res.status(404).json({ error: 'Next scene not found' });
  }

  res.json({
    success: true,
    data: {
      choice: {
        ...choice,
        feedback: choice.correct ? 'Excellent choice!' : 'There was a better option here.',
      },
      nextScene,
    },
  });
});

module.exports = router;

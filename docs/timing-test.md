# Timing test

Owner: friend's lane. Question: how long does it take to write a repair request by hand, compared with using FixProof?

Rule: only record real times from real people. Never estimate or fill in a number. If we run fewer than 3 people, report the number we actually ran.

## Setup

- People: 3 volunteers who did not build FixProof. Students who rent or plan to rent are best.
- Scenario (same for everyone): "The kitchen faucet in your apartment drips all night. Write to your landlord asking for a repair. Include a photo."
- Prop: a real dripping tap, or a printed photo of one placed where they can photograph it.
- Device: the volunteer's own phone if they agree. Otherwise one of ours.
- Stopwatch: a phone timer, run by a second person.
- Use the deployed Cloud Run app, not mock data.

## Fairness

- Half the people go by hand first, half go FixProof first. With 3 people: person 1 by hand first, person 2 FixProof first, person 3 by hand first.
- Same instructions read word for word to everyone. Do not coach during a run.
- Answer questions only about the scenario, not about how to use the app.

## What "done" means

- By hand: the message is written in their usual email or texting app, with the photo attached, ready to send. Timer stops when they say "done". They do not actually send it.
- FixProof: the email is copied or open in their mail app, with the subject and body filled in. Timer stops when they say "done". They do not send it.

## Script to read

> We're timing how long it takes to write a repair request. Pretend the kitchen faucet in your apartment drips all night. Write to your landlord asking for a repair, with a photo. Say "done" when it's ready to send, but don't send it. I'll start the timer when you start.

Before the FixProof run, add: "Use this app. Start on this screen." Open the app on the log screen.

## Record

Fill in right after each run. Times in minutes and seconds.

| Person | Order | By hand (m:ss) | FixProof (m:ss) | Message complete by hand? | FixProof email edited before done? | Comment (their words) |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | hand first | | | | | |
| 2 | FixProof first | | | | | |
| 3 | hand first | | | | | |

Also note anything that went wrong (app error, slow network, confusion) in the Comment column. Those count too.

## Results

PENDING. Fill in only after the runs above.

- Median by hand:
- Median with FixProof:
- What we saw:

When reporting, say how many people ran it and that this is a small informal test, not a study.

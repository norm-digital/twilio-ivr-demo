require("dotenv").config();
const express = require("express");
const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;

const app = express();
app.use(express.urlencoded({ extended: false })); // parse form-encoded webhook bodies

// 1) Endpoint Twilio will request when the call is answered
app.post("/voice", (req, res) => {
  // in your /voice handler
  const twiml = new VoiceResponse();
  // test with a spoken prompt:
  twiml.say("Hello! Press 1 to confirm.");
  twiml.gather({ numDigits: 1, action: "/gather", method: "POST" });
  res.type("text/xml").send(twiml.toString());
  //   const twiml = new VoiceResponse();

  //   // Play your hosted recording:
  //   twiml.play("https://example.com/your-recording.mp3");

  //   // Then gather one keypress, POST it to /gather
  //   const gather = twiml.gather({
  //     numDigits: 1,
  //     action: "/gather",
  //     method: "POST",
  //   });
  //   gather.say("Press 1 to confirm, or any other key to cancel.");

  //   // If they never press a key:
  //   twiml.redirect("/no-input");

  //   res.type("text/xml").send(twiml.toString());
});

app.post("/no-input", (req, res) => {
  const twiml = new VoiceResponse();
  twiml.say("No input received. Goodbye.");
  twiml.hangup();
  res.type("text/xml").send(twiml.toString());
});

// 2) Handle the gathered digit:
app.post("/gather", (req, res) => {
  const digit = req.body.Digits;
  const twiml = new VoiceResponse();

  if (digit === "1") {
    // → YOUR “pressed 1” logic here
    twiml.say("Thank you, your selection is confirmed.");
    // e.g. trigger a webhook, update a database, etc.
  } else {
    twiml.say("You did not press 1. Goodbye.");
  }

  twiml.hangup();
  res.type("text/xml").send(twiml.toString());
});

// 3) (Optional) Endpoint to *initiate* an outbound call via the REST API:
app.post("/make-call", async (req, res) => {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    const call = await client.calls.create({
      url: `${process.env.PUBLIC_URL}/voice`, // TwiML endpoint
      to: req.body.to, // callee’s number, e.g. "+15551234567"
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    res.json({ sid: call.sid });
  } catch (err) {
    console.error(err);
    res.status(500).send("Call failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

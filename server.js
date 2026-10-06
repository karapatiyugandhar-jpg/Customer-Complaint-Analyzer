const express = require("express");
const path = require("path");

const app = express();
const PORT = 5001;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const keywords = {
  "Delivery Delay": ["late", "delay", "delayed", "delivery", "arrive", "arrived", "not delivered", "shipping"],
  "Product Quality": ["quality", "damaged", "broken", "defective", "wrong product", "poor quality", "faulty"],
  "Payment Issue": ["payment", "paid", "transaction", "refund", "money", "charged", "debit", "upi", "card"],
  "Service Issue": ["service", "support", "staff", "response", "customer care", "help"],
  "Account Issue": ["account", "login", "password", "otp", "blocked", "profile"],
  "Other": []
};

function analyzeComplaint(text) {
  const clean = text.toLowerCase().trim();

  if (!clean) {
    return {
      category: "No Complaint",
      priority: "Low",
      sentiment: "Neutral",
      confidence: 0,
      keywords: [],
      summary: "Please enter or speak your complaint."
    };
  }

  let category = "Other";
  let bestScore = 0;
  let matched = [];

  for (const [cat, words] of Object.entries(keywords)) {
    if (cat === "Other") continue;
    const hits = words.filter(word => clean.includes(word));
    if (hits.length > bestScore) {
      bestScore = hits.length;
      category = cat;
      matched = hits;
    }
  }

  const negativeWords = [
    "bad", "worst", "angry", "disappointed", "terrible", "poor",
    "hate", "fraud", "cheated", "useless", "problem", "complaint",
    "not working", "damaged", "late", "delay"
  ];
  const urgentWords = [
    "urgent", "immediately", "asap", "emergency", "serious",
    "fraud", "blocked", "double charged", "money lost"
  ];

  const negativeCount = negativeWords.filter(w => clean.includes(w)).length;
  const urgent = urgentWords.some(w => clean.includes(w));

  let sentiment = "Neutral";
  if (negativeCount >= 2) sentiment = "Very Negative";
  else if (negativeCount >= 1) sentiment = "Negative";
  else if (/\b(good|great|happy|satisfied|excellent|thank)\b/.test(clean)) sentiment = "Positive";

  let priority = "Low";
  if (urgent || negativeCount >= 2) priority = "High";
  else if (negativeCount >= 1 || bestScore >= 2) priority = "Medium";

  const confidence = Math.min(98, 55 + bestScore * 12 + (category !== "Other" ? 10 : 0));

  let summary = `The complaint is mainly related to ${category.toLowerCase()}.`;
  if (matched.length) summary += ` Detected keywords: ${matched.join(", ")}.`;
  summary += ` Recommended priority: ${priority}.`;

  return {
    category,
    priority,
    sentiment,
    confidence,
    keywords: matched,
    summary
  };
}

app.post("/api/analyze", (req, res) => {
  const { text } = req.body;
  res.json(analyzeComplaint(text || ""));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Customer Complaint Analyzer running at http://localhost:${PORT}`);
});

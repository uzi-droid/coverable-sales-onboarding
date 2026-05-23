export const SCRIPT_START_STATE_ID = "call_start";

const openingButtons = [
  ["What is this regarding?", "secretary_regarding"],
  ["Can you send an email?", "secretary_email"],
  ["They're busy", "secretary_busy"],
  ["We already use software", "secretary_software"],
  ["We're not interested", "secretary_not_interested"],
  ["Attorney is unavailable", "secretary_unavailable"],
  ["What company again?", "secretary_company"],
  ["How did you get our number?", "secretary_number"],
  ["We're too small", "secretary_small"],
  ["We're too large / enterprise", "secretary_enterprise"],
  ["Is this AI?", "secretary_ai"],
  ["Does it integrate with our software?", "secretary_integrate"],
  ["Can you explain exactly what it does?", "secretary_explain"],
  ["Put me through / transfer", "secretary_transfer"],
  ["Take a message", "secretary_message"],
  ["Wrong person", "secretary_wrong_person"]
];

function buttons(items) {
  return items.map(([label, nextStateId]) => ({ label, nextStateId }));
}

export const immigrationScriptStates = {
  call_start: {
    id: "call_start",
    title: "New Call",
    audience: "Unknown",
    mode: "prompt",
    goal: "Identify who answered.",
    script: "Who answered the phone?",
    notes: "Choose the role as soon as you know it. The receptionist path is built for this version.",
    buttons: buttons([
      ["Secretary / Receptionist", "secretary_opening"],
      ["Paralegal", "paralegal_pending"],
      ["Attorney", "attorney_pending"],
      ["Voicemail", "voicemail_pending"]
    ])
  },
  secretary_opening: {
    id: "secretary_opening",
    title: "Receptionist Opener",
    audience: "Secretary / Receptionist",
    goal: "Get routed to the person responsible for immigration workflow or technology decisions.",
    script:
      "Hey, this is [REP NAME] from Coverable. We built an AI platform for immigration firms that automatically generates cover letters, legal arguments, and fully organized exhibit packets in minutes instead of days. Who would be the best person to briefly speak with regarding immigration case workflow software?",
    notes:
      "Do not demo the product here. Sound relevant and professional, then ask for the right person.",
    buttons: buttons(openingButtons)
  },
  secretary_regarding: {
    id: "secretary_regarding",
    title: "What is this regarding?",
    audience: "Secretary / Receptionist",
    goal: "Clarify relevance briefly, then ask for routing.",
    script:
      "It's regarding immigration case preparation workflow. Coverable turns uploaded client documents into cover letters, supporting legal arguments, exhibit indices, and organized filing-ready packets, while the attorney stays in control of review. Who would be the right person to briefly speak with about that?",
    notes: "One sentence of value is enough. Finish with the routing question.",
    buttons: buttons([
      ["Put me through", "secretary_transfer"],
      ["Send an email", "secretary_email"],
      ["Can you explain more?", "secretary_explain"],
      ["They're busy", "secretary_busy"],
      ["Take a message", "secretary_message"]
    ])
  },
  secretary_email: {
    id: "secretary_email",
    title: "Send an email",
    audience: "Secretary / Receptionist",
    goal: "Get the decision maker's name and direct contact before sending anything.",
    script:
      "Absolutely, I can send a short overview. I just want to make sure it goes to the right person. Who handles tools related to immigration document preparation and case workflow, and what is the best email for them?",
    notes:
      "Do not settle for a generic inbox without first asking for the responsible attorney or operations contact.",
    buttons: buttons([
      ["Provides contact", "contact_obtained"],
      ["Only general inbox", "general_inbox"],
      ["Requests more detail first", "secretary_regarding"],
      ["Refuses details", "polite_close"]
    ])
  },
  secretary_busy: {
    id: "secretary_busy",
    title: "They're busy",
    audience: "Secretary / Receptionist",
    goal: "Secure a callback time or the correct direct contact.",
    script:
      "Understood. I do not need to interrupt them now. When would be a better time for a brief call, or what is the best direct email to send a concise overview of how firms reduce case-prep time?",
    notes: "Respect the block. Convert it into a precise next step.",
    buttons: buttons([
      ["Offers callback time", "callback_secured"],
      ["Gives email", "contact_obtained"],
      ["Take a message", "secretary_message"],
      ["Still unavailable", "polite_close"]
    ])
  },
  secretary_software: {
    id: "secretary_software",
    title: "We already use software",
    audience: "Secretary / Receptionist",
    goal: "Differentiate Coverable without pitching deeply.",
    script:
      "That makes sense. Coverable is not just case management software. It generates legal arguments, organizes exhibits, and assembles filing-ready immigration packets from client documents. Who would evaluate whether that complements the firm's current workflow?",
    notes: "Differentiate, then return immediately to routing.",
    buttons: buttons([
      ["Names decision maker", "contact_obtained"],
      ["Transfer", "secretary_transfer"],
      ["Ask for an email", "secretary_email"],
      ["No interest", "secretary_not_interested"]
    ])
  },
  secretary_not_interested: {
    id: "secretary_not_interested",
    title: "We're not interested",
    audience: "Secretary / Receptionist",
    goal: "Respectfully test whether this is a true decision-maker response.",
    script:
      "I understand. Just so I do not follow up incorrectly, is that coming from the attorney who oversees immigration case workflow, or would it be better for me to send them one short note directly?",
    notes: "Never argue. Determine whether the decision maker has actually reviewed the relevance.",
    buttons: buttons([
      ["Send short note", "secretary_email"],
      ["Names decision maker", "contact_obtained"],
      ["Final no", "polite_close"]
    ])
  },
  secretary_unavailable: {
    id: "secretary_unavailable",
    title: "Attorney unavailable",
    audience: "Secretary / Receptionist",
    goal: "Get a usable callback path.",
    script:
      "No problem. What is the best time to reach them briefly, or is there an attorney or operations manager I should email about reducing immigration packet preparation time?",
    notes: "Leave with a name, time, or direct email whenever possible.",
    buttons: buttons([
      ["Callback time", "callback_secured"],
      ["Alternative contact", "contact_obtained"],
      ["Take a message", "secretary_message"],
      ["Send email", "secretary_email"]
    ])
  },
  secretary_company: {
    id: "secretary_company",
    title: "What company again?",
    audience: "Secretary / Receptionist",
    goal: "Restate the company clearly and resume routing.",
    script:
      "Coverable. We help immigration firms turn client documents into reviewable filing packets, including cover letters, arguments, and organized exhibits. Who would be best to speak with about that workflow?",
    notes: "Say Coverable slowly and clearly. Avoid restarting the entire pitch.",
    buttons: buttons([
      ["Transfer", "secretary_transfer"],
      ["What is this regarding?", "secretary_regarding"],
      ["Send an email", "secretary_email"]
    ])
  },
  secretary_number: {
    id: "secretary_number",
    title: "How did you get our number?",
    audience: "Secretary / Receptionist",
    goal: "Answer transparently and restore relevance.",
    script:
      "I found the firm's public contact information while researching immigration practices that may handle document-heavy filings. I'm only trying to identify the right person for a brief workflow conversation. Who would that be?",
    notes: "Stay calm and transparent. Never sound evasive about public outreach.",
    buttons: buttons([
      ["Identifies person", "contact_obtained"],
      ["Send an email", "secretary_email"],
      ["Not interested", "secretary_not_interested"]
    ])
  },
  secretary_small: {
    id: "secretary_small",
    title: "We're too small",
    audience: "Secretary / Receptionist",
    goal: "Show relevance to a small firm and reach the owner or attorney.",
    script:
      "That may actually be where it is most useful. Smaller immigration firms often feel the time cost of assembling packets most sharply. Who is the attorney or owner I should briefly speak with to see if this is relevant?",
    notes: "Do not promise fit. Use size as the reason for a brief evaluation.",
    buttons: buttons([
      ["Owner / attorney contact", "contact_obtained"],
      ["Transfer", "secretary_transfer"],
      ["Send an email", "secretary_email"],
      ["No interest", "polite_close"]
    ])
  },
  secretary_enterprise: {
    id: "secretary_enterprise",
    title: "We're enterprise",
    audience: "Secretary / Receptionist",
    goal: "Find the workflow, operations, or technology decision maker.",
    script:
      "Understood. For a larger firm, this is usually reviewed by immigration operations, legal technology, or a managing attorney because it affects document production at scale. Who owns that workflow on your team?",
    notes: "Large firms require routing, not a longer pitch.",
    buttons: buttons([
      ["Operations contact", "contact_obtained"],
      ["Technology contact", "contact_obtained"],
      ["Send to procurement", "secretary_email"],
      ["Transfer", "secretary_transfer"]
    ])
  },
  secretary_ai: {
    id: "secretary_ai",
    title: "Is this AI?",
    audience: "Secretary / Receptionist",
    goal: "Confirm AI use while keeping attorney review central.",
    script:
      "Yes. It uses AI to generate and organize immigration case materials from uploaded documents, but the attorney reviews and controls the final filing. Who would be the right person to see whether that could save the firm preparation time?",
    notes: "Acknowledge risk concerns without entering a technical discussion.",
    buttons: buttons([
      ["Concerned about AI", "ai_concern"],
      ["Transfer", "secretary_transfer"],
      ["Send email", "secretary_email"],
      ["Identifies attorney", "contact_obtained"]
    ])
  },
  secretary_integrate: {
    id: "secretary_integrate",
    title: "Does it integrate?",
    audience: "Secretary / Receptionist",
    goal: "Avoid unsupported technical claims and route the question correctly.",
    script:
      "That depends on the firm's current setup, and I do not want to give you an imprecise answer. The core value is creating reviewable immigration packets from client documents. Who would be the right person to discuss workflow and integration requirements with?",
    notes: "Do not speculate about integrations on a cold call.",
    buttons: buttons([
      ["Technology contact", "contact_obtained"],
      ["Attorney contact", "contact_obtained"],
      ["Send email", "secretary_email"],
      ["Transfer", "secretary_transfer"]
    ])
  },
  secretary_explain: {
    id: "secretary_explain",
    title: "Explain exactly what it does",
    audience: "Secretary / Receptionist",
    goal: "Give a short concrete explanation and regain the route to a decision maker.",
    script:
      "A firm uploads client documents, and Coverable helps generate cover letters, petition letters, legal arguments, supporting documents, exhibit indices, and a fully organized filing-ready packet for attorney review. The goal is to save 30-40 hours of repetitive case preparation. Who should briefly evaluate that at the firm?",
    notes: "This is the maximum detail for a receptionist. Do not begin a feature demo.",
    buttons: buttons([
      ["Transfer", "secretary_transfer"],
      ["Identifies decision maker", "contact_obtained"],
      ["Is this AI?", "secretary_ai"],
      ["Send email", "secretary_email"],
      ["Not interested", "secretary_not_interested"]
    ])
  },
  secretary_transfer: {
    id: "secretary_transfer",
    title: "Transfer Accepted",
    audience: "Secretary / Receptionist",
    goal: "Thank them and prepare to speak to the decision maker.",
    script: "Thank you, I appreciate it.",
    notes:
      "As soon as the attorney answers, reset your tone and use the attorney opener. The attorney branch can be added next.",
    buttons: buttons([
      ["Attorney answers", "attorney_pending"],
      ["Sent to voicemail", "voicemail_pending"],
      ["Transfer fails", "secretary_unavailable"],
      ["Restart call", "call_start"]
    ])
  },
  secretary_message: {
    id: "secretary_message",
    title: "Take a message",
    audience: "Secretary / Receptionist",
    goal: "Leave a concise, relevant callback message and request direct contact.",
    script:
      "Please let them know [REP NAME] from Coverable called about reducing time spent preparing immigration filing packets, including legal arguments and organized exhibits. I can send a brief overview as well. What is the best direct email for them?",
    notes: "A message is better when paired with a name, email, or callback time.",
    buttons: buttons([
      ["Provides email", "contact_obtained"],
      ["Provides callback time", "callback_secured"],
      ["Message only", "message_left"],
      ["Refuses", "polite_close"]
    ])
  },
  secretary_wrong_person: {
    id: "secretary_wrong_person",
    title: "Wrong person",
    audience: "Secretary / Receptionist",
    goal: "Find the correct owner of immigration case workflow.",
    script:
      "Thanks for letting me know. Who would be the right attorney, office manager, or operations contact for immigration document preparation and workflow software?",
    notes: "Make it easy for them to route you: offer likely job roles.",
    buttons: buttons([
      ["Provides correct contact", "contact_obtained"],
      ["Transfer", "secretary_transfer"],
      ["General inbox", "general_inbox"],
      ["Does not know", "polite_close"]
    ])
  },
  ai_concern: {
    id: "ai_concern",
    title: "AI concern",
    audience: "Secretary / Receptionist",
    goal: "Lower risk concerns without asking the receptionist to decide.",
    script:
      "That is completely fair. Coverable does not replace attorney judgment; it prepares organized drafts and filing materials for attorney review. I would only want to show the appropriate attorney how the review process works. Who would that be?",
    notes: "Safety framing first, routing question second.",
    buttons: buttons([
      ["Names attorney", "contact_obtained"],
      ["Transfer", "secretary_transfer"],
      ["Send information", "secretary_email"],
      ["Still no", "polite_close"]
    ])
  },
  contact_obtained: {
    id: "contact_obtained",
    title: "Contact Identified",
    audience: "Secretary / Receptionist",
    goal: "Confirm the person's details and seek the strongest next step.",
    script:
      "Perfect, thank you. Would you be able to connect me now, or should I send them a short email and call back at a better time?",
    notes: "Record the name and contact in CRM immediately after the call.",
    buttons: buttons([
      ["Connect now", "secretary_transfer"],
      ["Email them", "email_confirmed"],
      ["Callback time", "callback_secured"],
      ["End call", "polite_close"]
    ])
  },
  general_inbox: {
    id: "general_inbox",
    title: "General Inbox Only",
    audience: "Secretary / Receptionist",
    goal: "Attach a decision maker or follow-up time to a generic email.",
    script:
      "I can send it there. To help your team route it correctly, whose attention should I put it to, and when would be reasonable to call back briefly?",
    notes: "A generic inbox without a name or follow-up time is a weak outcome.",
    buttons: buttons([
      ["Provides name", "contact_obtained"],
      ["Provides callback time", "callback_secured"],
      ["Inbox only", "email_confirmed"]
    ])
  },
  callback_secured: {
    id: "callback_secured",
    title: "Callback Secured",
    audience: "Secretary / Receptionist",
    goal: "Confirm the time and responsible person.",
    script:
      "Great, I will call back then. Just to confirm, should I ask for the attorney or person who oversees immigration case workflow?",
    notes: "Log the callback time and contact in CRM before making another call.",
    buttons: buttons([
      ["Confirms contact", "call_complete"],
      ["Offers transfer now", "secretary_transfer"],
      ["Adds email", "email_confirmed"]
    ])
  },
  email_confirmed: {
    id: "email_confirmed",
    title: "Email Route Secured",
    audience: "Secretary / Receptionist",
    goal: "Close professionally with a clear follow-up path.",
    script:
      "Thank you. I will keep the email brief and specific to immigration packet preparation, then follow up with the appropriate person.",
    notes: "Log the email address, named contact, and follow-up date in CRM.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Offers transfer", "secretary_transfer"],
      ["Restart", "call_start"]
    ])
  },
  message_left: {
    id: "message_left",
    title: "Message Left",
    audience: "Secretary / Receptionist",
    goal: "End courteously and prepare follow-up.",
    script: "Thank you for passing that along. I appreciate your help.",
    notes: "Log the voicemail/message outcome and schedule the next attempt in CRM.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Restart", "call_start"]
    ])
  },
  polite_close: {
    id: "polite_close",
    title: "Close Respectfully",
    audience: "Secretary / Receptionist",
    goal: "End professionally without damaging future outreach.",
    script: "Understood. Thank you for your time. Have a good day.",
    notes: "Log the outcome and any useful reason given. Do not push further.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Restart", "call_start"]
    ])
  },
  call_complete: {
    id: "call_complete",
    title: "Call Complete",
    audience: "Rep",
    goal: "Log the outcome while details are fresh.",
    script: "Log the contact, outcome, next step, and follow-up date in CRM.",
    notes: "The conversation is complete. Restart when ready for the next call.",
    buttons: buttons([["Start next call", "call_start"]])
  },
  paralegal_pending: {
    id: "paralegal_pending",
    title: "Paralegal Branch",
    audience: "Paralegal",
    goal: "Branch planned next.",
    script: "The adaptive paralegal path will be built next. Restart and select Secretary / Receptionist to use the complete live branch.",
    notes: "",
    buttons: buttons([["Restart", "call_start"]])
  },
  attorney_pending: {
    id: "attorney_pending",
    title: "Attorney Branch",
    audience: "Attorney",
    goal: "Branch planned next.",
    script: "The adaptive attorney path will be built next. Restart and select Secretary / Receptionist to use the complete live branch.",
    notes: "",
    buttons: buttons([["Restart", "call_start"]])
  },
  voicemail_pending: {
    id: "voicemail_pending",
    title: "Voicemail Branch",
    audience: "Voicemail",
    goal: "Branch planned next.",
    script: "The adaptive voicemail path will be built next. Restart and select Secretary / Receptionist to use the complete live branch.",
    notes: "",
    buttons: buttons([["Restart", "call_start"]])
  }
};

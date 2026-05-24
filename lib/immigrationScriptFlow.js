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
    notes: "Choose the role as soon as you know it. Receptionist and paralegal paths are ready for live use.",
    buttons: buttons([
      ["Secretary / Receptionist", "secretary_opening"],
      ["Paralegal", "paralegal_opening"],
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
  paralegal_opening: {
    id: "paralegal_opening",
    title: "Paralegal Opener",
    audience: "Paralegal",
    goal: "Learn whether this person feels the packet-preparation pain.",
    script:
      "Hey, this is [REP NAME] from Coverable. We work with immigration firms to automate the most time-consuming parts of case prep, especially drafting cover letters, organizing exhibits, and assembling filing-ready packets. Are you involved in preparing immigration petitions or packets at the firm?",
    notes:
      "A paralegal may be a strong internal advocate. Start with their workflow before asking to reach an attorney.",
    buttons: buttons([
      ["Yes, I prepare packets", "paralegal_prepares_packets"],
      ["No, I don't handle that", "paralegal_not_handler"],
      ["We already use software", "paralegal_software"],
      ["Attorney handles that", "paralegal_attorney_handles"],
      ["We're not interested", "paralegal_not_interested"],
      ["Can you send an email?", "paralegal_email"],
      ["How does it work?", "paralegal_how_it_works"],
      ["Is this AI?", "paralegal_ai"]
    ])
  },
  paralegal_prepares_packets: {
    id: "paralegal_prepares_packets",
    title: "Prepares Packets",
    audience: "Paralegal",
    goal: "Confirm pain and introduce direct value.",
    script:
      "That's exactly the workflow we help with. Coverable can take the supporting documents, generate the cover letter or petition letter, organize the exhibits, create the index, and assemble the packet automatically. For firms doing O-1s, E-2s, EB-1s, TNs, H-1Bs, and similar cases, this can save dozens of hours per case. How are you currently preparing packets?",
    notes:
      "Let them describe the work. Their words will make the demo invitation more relevant.",
    buttons: buttons([
      ["Manually in Word / PDF", "paralegal_manual_workflow"],
      ["We use immigration software", "paralegal_software"],
      ["Attorney writes the letter", "paralegal_attorney_writes"],
      ["Paralegal prepares first draft", "paralegal_first_draft"],
      ["Depends on case type", "paralegal_case_mix"],
      ["Interested / tell me more", "paralegal_interested"],
      ["Not interested", "paralegal_not_interested"]
    ])
  },
  paralegal_not_handler: {
    id: "paralegal_not_handler",
    title: "Not Their Workflow",
    audience: "Paralegal",
    goal: "Route to the correct person.",
    script:
      "No problem. Who usually handles petition preparation, cover letters, or exhibit packets at the firm?",
    notes: "A paralegal is often able to identify the real workflow owner quickly.",
    buttons: buttons([
      ["Gives name / contact", "paralegal_contact_obtained"],
      ["Says attorney handles it", "paralegal_attorney_handles"],
      ["Says another paralegal handles it", "paralegal_other_paralegal"],
      ["Says send email", "paralegal_email"],
      ["Refuses / not sure", "paralegal_end_call"]
    ])
  },
  paralegal_software: {
    id: "paralegal_software",
    title: "Already Uses Software",
    audience: "Paralegal",
    goal: "Differentiate Coverable from case management tools.",
    script:
      "Totally. Most firms we speak with already use some kind of immigration software. Coverable is different because it is not just case management. It actually generates the legal argument, cover letter, exhibit index, and organized packet from the uploaded documents. What software are you using now?",
    notes: "Be curious, not combative. Existing software does not mean the drafting work is automated.",
    buttons: buttons([
      ["Docketwise", "paralegal_existing_platform"],
      ["INSZoom", "paralegal_existing_platform"],
      ["LawLogix", "paralegal_existing_platform"],
      ["PrimaFacie", "paralegal_existing_platform"],
      ["Clio", "paralegal_existing_platform"],
      ["Custom / internal", "paralegal_existing_platform"],
      ["Not sure", "paralegal_existing_platform"],
      ["Software already does this", "paralegal_software_does_this"]
    ])
  },
  paralegal_attorney_handles: {
    id: "paralegal_attorney_handles",
    title: "Attorney Handles It",
    audience: "Paralegal",
    goal: "Get a connection to the decision maker.",
    script:
      "Got it. Usually the attorney owns the final review, but the packet prep and exhibit organization still take a lot of staff time. Would [ATTORNEY NAME] be the right person to show a quick demo to, or is there someone else who manages immigration operations?",
    notes: "Position the attorney as reviewer, then ask for the right route.",
    buttons: buttons([
      ["Gives attorney", "paralegal_contact_obtained"],
      ["Offers email", "paralegal_email"],
      ["Attorney unavailable", "paralegal_attorney_unavailable"],
      ["Not interested", "paralegal_not_interested"],
      ["Paralegal team would review first", "paralegal_team_review"]
    ])
  },
  paralegal_not_interested: {
    id: "paralegal_not_interested",
    title: "Not Interested",
    audience: "Paralegal",
    goal: "Discover the reason without arguing.",
    script:
      "Totally understood. Just so I don't waste your time, is that because your current process is working well, or because now is just not a good time to look at tools?",
    notes: "Accept the response. One respectful diagnostic question is enough.",
    buttons: buttons([
      ["Current process works", "paralegal_process_works"],
      ["Bad timing", "paralegal_bad_timing"],
      ["Too busy", "paralegal_too_busy"],
      ["Not decision maker", "paralegal_not_handler"],
      ["Send info", "paralegal_send_info"],
      ["End call", "paralegal_end_call"]
    ])
  },
  paralegal_email: {
    id: "paralegal_email",
    title: "Send an Email",
    audience: "Paralegal",
    goal: "Get the right recipient and make the email relevant.",
    script:
      "Absolutely. I want to make sure I send the right version. Is the best person the attorney, the office manager, or whoever oversees immigration operations?",
    notes: "A named recipient and case type make the follow-up much stronger.",
    buttons: buttons([
      ["Gives attorney email", "paralegal_email_captured"],
      ["Gives paralegal email", "paralegal_email_captured"],
      ["Gives general inbox", "paralegal_general_inbox"],
      ["Asks what to include", "paralegal_send_info"],
      ["Refuses name", "paralegal_general_inbox"]
    ])
  },
  paralegal_how_it_works: {
    id: "paralegal_how_it_works",
    title: "How It Works",
    audience: "Paralegal",
    goal: "Explain the workflow clearly.",
    script:
      "You upload the client's supporting documents. Coverable reads the documents, drafts the cover letter or petition letter, builds the legal argument, organizes the exhibits, creates the exhibit index, and outputs a reviewable filing-ready packet. The attorney can then review and edit instead of starting from scratch.",
    notes: "This is a workflow explanation, not a full demo. Move toward their question or a walkthrough.",
    buttons: buttons([
      ["Is this AI?", "paralegal_ai"],
      ["Which case types?", "paralegal_case_types"],
      ["How accurate is it?", "paralegal_accuracy"],
      ["Can attorneys edit?", "paralegal_editable"],
      ["Does it cite documents?", "paralegal_sources"],
      ["Interested in demo", "paralegal_interested"],
      ["Sounds expensive", "paralegal_expensive"]
    ])
  },
  paralegal_ai: {
    id: "paralegal_ai",
    title: "Is This AI?",
    audience: "Paralegal",
    goal: "Address hallucination concerns.",
    script:
      "Yes, but the important distinction is that Coverable is built for legal packet generation, not generic AI chatting. The system uses structured workflows and source documents so the attorney can review where the information came from. It is designed to produce reviewable legal work product, not random AI text.",
    notes: "Paralegals will care about trust and review. Invite the real concern.",
    buttons: buttons([
      ["Worried about hallucinations", "paralegal_accuracy"],
      ["Worried about confidentiality", "paralegal_confidentiality"],
      ["Does client data train AI?", "paralegal_data_training"],
      ["Attorney would need to approve", "paralegal_attorney_handles"],
      ["Interested in demo", "paralegal_interested"]
    ])
  },
  paralegal_accuracy: {
    id: "paralegal_accuracy",
    title: "Accuracy and Review",
    audience: "Paralegal",
    goal: "Emphasize attorney review and traceability.",
    script:
      "The goal is not to replace attorney review. The goal is to eliminate the repetitive drafting, exhibit organization, and packet assembly work. Every output is reviewable, editable, and traceable back to the source documents so the attorney can verify the work faster.",
    notes: "Never promise an approval outcome. Focus on verifiable work product and review speed.",
    buttons: buttons([
      ["Asks about approval rate", "paralegal_approval_rate"],
      ["Asks about source citations", "paralegal_sources"],
      ["Asks about edits", "paralegal_editable"],
      ["Interested in demo", "paralegal_interested"],
      ["Skeptical", "paralegal_skeptical"]
    ])
  },
  paralegal_case_types: {
    id: "paralegal_case_types",
    title: "Case Types",
    audience: "Paralegal",
    goal: "Identify the firm's most relevant immigration workflow.",
    script:
      "We support many immigration workflows, including O-1, EB-1, NIW, EB-2, EB-3, EB-5, E-1, E-2, L-1, H-1B, H-2B, TN, asylum, cancellation of removal, business plans, motions, briefs, and supporting documentation.",
    notes: "Once they identify a case category, connect a demo to that exact work.",
    buttons: buttons([
      ["We do O-1 / EB-1", "paralegal_relevant_practice"],
      ["We do E-2 / investor cases", "paralegal_relevant_practice"],
      ["We do H-1B", "paralegal_relevant_practice"],
      ["We do family-based", "paralegal_relevant_practice"],
      ["We do removal / asylum", "paralegal_relevant_practice"],
      ["Asks for demo", "paralegal_interested"],
      ["Not relevant", "paralegal_end_call"]
    ])
  },
  paralegal_expensive: {
    id: "paralegal_expensive",
    title: "Sounds Expensive",
    audience: "Paralegal",
    goal: "Reframe around hours saved.",
    script:
      "The reason firms look at it is because even one complex petition can take 30 to 40 hours of drafting, exhibit organization, and packet assembly. If Coverable saves even a fraction of that, the math usually makes sense quickly.",
    notes: "Do not negotiate price. Tie value to labor and move toward the decision maker or demo.",
    buttons: buttons([
      ["Asks pricing", "paralegal_pricing"],
      ["Budget issue", "paralegal_budget"],
      ["Attorney decides", "paralegal_attorney_handles"],
      ["Wants demo", "paralegal_interested"],
      ["Wants email", "paralegal_send_info"]
    ])
  },
  paralegal_editable: {
    id: "paralegal_editable",
    title: "Attorney Editing",
    audience: "Paralegal",
    goal: "Confirm the review workflow.",
    script:
      "Yes. The output is meant to be reviewed and edited by the attorney. Coverable gives the attorney a strong first draft, organized exhibits, and a complete packet structure so they are reviewing instead of building everything manually.",
    notes: "Attorney control is the answer. Then identify who should see it.",
    buttons: buttons([
      ["Interested", "paralegal_interested"],
      ["Attorney should see this", "paralegal_attorney_handles"],
      ["Can paralegals use it?", "paralegal_paralegal_use"],
      ["Asks about permissions", "paralegal_permissions"],
      ["Send email", "paralegal_send_info"]
    ])
  },
  paralegal_sources: {
    id: "paralegal_sources",
    title: "Source Documents",
    audience: "Paralegal",
    goal: "Emphasize traceability.",
    script:
      "Yes. The system is designed so the work product traces back to the source documents. That way the attorney can verify the claims, evidence, and supporting documents instead of trusting unsupported AI text.",
    notes: "Traceability is a strong reason to show the workflow rather than describe it.",
    buttons: buttons([
      ["Interested in demo", "paralegal_interested"],
      ["Asks about confidentiality", "paralegal_confidentiality"],
      ["How does upload work?", "paralegal_upload"],
      ["What docs are needed?", "paralegal_documents"]
    ])
  },
  paralegal_confidentiality: {
    id: "paralegal_confidentiality",
    title: "Confidentiality",
    audience: "Paralegal",
    goal: "Address security concerns carefully.",
    script:
      "That makes sense, especially for immigration files. Coverable is designed for law firms, with firm-level data isolation, no training on client data, and workflows built around attorney review and confidentiality.",
    notes: "Offer formal security information rather than expanding technical claims on the call.",
    buttons: buttons([
      ["Asks for security info", "paralegal_security_info"],
      ["Wants attorney to review", "paralegal_attorney_handles"],
      ["Send email", "paralegal_send_info"],
      ["Interested in demo", "paralegal_interested"]
    ])
  },
  paralegal_interested: {
    id: "paralegal_interested",
    title: "Interested",
    audience: "Paralegal",
    goal: "Move toward a demo.",
    script:
      "The best way to understand it is a quick demo where we show a real immigration packet being assembled from documents. It usually clicks once someone sees the cover letter, legal argument, exhibit index, and packet generate together. Who should be on that demo from your firm?",
    notes: "Include the paralegal if they feel the pain, along with anyone who approves workflow tools.",
    buttons: buttons([
      ["Book demo", "paralegal_book_demo"],
      ["Need attorney", "paralegal_attorney_handles"],
      ["Send email first", "paralegal_send_info"],
      ["Ask pricing", "paralegal_pricing"],
      ["Ask case types", "paralegal_case_types"]
    ])
  },
  paralegal_book_demo: {
    id: "paralegal_book_demo",
    title: "Book Demo",
    audience: "Paralegal",
    goal: "Schedule with the right attendees.",
    script:
      "Great. Who would be the right person to include, and what is the best email to send the calendar invite?",
    notes: "Capture the attendee, email, and a concrete time before ending the call.",
    buttons: buttons([
      ["Captured email", "paralegal_demo_details"],
      ["Needs attorney approval", "paralegal_attorney_handles"],
      ["Wants later", "paralegal_callback"],
      ["Send info first", "paralegal_send_info"]
    ])
  },
  paralegal_send_info: {
    id: "paralegal_send_info",
    title: "Targeted Follow-Up",
    audience: "Paralegal",
    goal: "Gather a recipient and personalize the follow-up.",
    script:
      "Absolutely. I'll send a short overview. To make it relevant, what types of immigration cases does your firm handle most often?",
    notes: "Log the case mix and recipient so the follow-up is useful, not generic.",
    buttons: buttons([
      ["Employment-based", "paralegal_email_captured"],
      ["Investor cases", "paralegal_email_captured"],
      ["Family-based", "paralegal_email_captured"],
      ["Humanitarian / removal", "paralegal_email_captured"],
      ["Mixed practice", "paralegal_email_captured"],
      ["Does not say", "paralegal_email_captured"]
    ])
  },
  paralegal_end_call: {
    id: "paralegal_end_call",
    title: "End Call",
    audience: "Paralegal",
    goal: "Close professionally.",
    script:
      "No problem. I appreciate your time. I'll make a note not to take more of your day. Have a good one.",
    notes: "Log the disposition and reason. Do not push further.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Restart", "call_start"]
    ])
  },
  paralegal_manual_workflow: {
    id: "paralegal_manual_workflow",
    title: "Manual Workflow",
    audience: "Paralegal",
    goal: "Turn manual effort into a demo conversation.",
    script:
      "That is where Coverable tends to help most. Roughly how much time does a complex packet take between drafting, exhibits, and assembly? If we showed that workflow being generated from documents, would you and the reviewing attorney be open to a quick demo?",
    notes: "Let them quantify their burden before moving to the demo.",
    buttons: buttons([
      ["Shares time / pain", "paralegal_interested"],
      ["Book demo", "paralegal_book_demo"],
      ["Attorney must approve", "paralegal_attorney_handles"],
      ["Send info", "paralegal_send_info"],
      ["Not interested", "paralegal_not_interested"]
    ])
  },
  paralegal_attorney_writes: {
    id: "paralegal_attorney_writes",
    title: "Attorney Drafts Letters",
    audience: "Paralegal",
    goal: "Connect attorney time savings to a demo.",
    script:
      "That is useful context. Coverable can prepare a source-grounded first draft and organized packet for attorney review, so the attorney spends time editing and applying judgment rather than assembling from scratch. Would the attorney be open to seeing that workflow?",
    notes: "Do not imply replacement of legal judgment.",
    buttons: buttons([
      ["Yes / show attorney", "paralegal_book_demo"],
      ["Give attorney contact", "paralegal_contact_obtained"],
      ["Send email", "paralegal_send_info"],
      ["Not interested", "paralegal_not_interested"]
    ])
  },
  paralegal_first_draft: {
    id: "paralegal_first_draft",
    title: "Paralegal First Draft",
    audience: "Paralegal",
    goal: "Show how Coverable reduces their first-draft workload.",
    script:
      "That first-draft work is exactly what can become repetitive. Coverable can draft from the uploaded evidence, organize exhibits, and build the packet structure, leaving you and the attorney to review and refine. Would it be worth showing on one of your common case types?",
    notes: "Speak to relief from repetitive work, not elimination of their role.",
    buttons: buttons([
      ["Interested", "paralegal_interested"],
      ["Which case types?", "paralegal_case_types"],
      ["Worried about accuracy", "paralegal_accuracy"],
      ["Send information", "paralegal_send_info"]
    ])
  },
  paralegal_case_mix: {
    id: "paralegal_case_mix",
    title: "Depends on Case Type",
    audience: "Paralegal",
    goal: "Identify the case type with the heaviest packet burden.",
    script:
      "That makes sense. Which case type causes the most drafting or exhibit-organization work for your team right now?",
    notes: "Use their highest-friction case as the basis for a targeted demo.",
    buttons: buttons([
      ["Employment / extraordinary ability", "paralegal_relevant_practice"],
      ["Investor / business", "paralegal_relevant_practice"],
      ["Humanitarian / removal", "paralegal_relevant_practice"],
      ["Other packet-heavy case", "paralegal_relevant_practice"],
      ["Not sure", "paralegal_case_types"]
    ])
  },
  paralegal_other_paralegal: {
    id: "paralegal_other_paralegal",
    title: "Another Paralegal Owns It",
    audience: "Paralegal",
    goal: "Reach the teammate who handles packet preparation.",
    script:
      "Would you be able to connect me with them, or share their email so I can send a short example specific to immigration packet preparation?",
    notes: "A knowledgeable paralegal contact is a useful next step.",
    buttons: buttons([
      ["Transfers", "paralegal_opening"],
      ["Shares email", "paralegal_email_captured"],
      ["Send general email", "paralegal_general_inbox"],
      ["Declines", "paralegal_end_call"]
    ])
  },
  paralegal_existing_platform: {
    id: "paralegal_existing_platform",
    title: "Existing Platform",
    audience: "Paralegal",
    goal: "Find out what remains manual.",
    script:
      "Got it. Does that system also generate the petition letter and legal argument from your evidence, organize the exhibits, and assemble a reviewable filing packet, or is some of that still manual?",
    notes: "Qualify the remaining work rather than criticizing their current tool.",
    buttons: buttons([
      ["Still manual", "paralegal_manual_workflow"],
      ["It does all of that", "paralegal_software_does_this"],
      ["Not sure", "paralegal_interested"],
      ["Send information", "paralegal_send_info"]
    ])
  },
  paralegal_software_does_this: {
    id: "paralegal_software_does_this",
    title: "Current Tool Covers It",
    audience: "Paralegal",
    goal: "Respect the answer while leaving a relevant follow-up route.",
    script:
      "Understood. It sounds like you may already have that workflow covered. Would it be helpful for me to send a short comparison for whoever reviews technology, or should I leave you to it?",
    notes: "Acknowledge fit may be weak. Do not force a demonstration.",
    buttons: buttons([
      ["Send comparison", "paralegal_send_info"],
      ["Technology contact", "paralegal_contact_obtained"],
      ["End call", "paralegal_end_call"]
    ])
  },
  paralegal_attorney_unavailable: {
    id: "paralegal_attorney_unavailable",
    title: "Attorney Unavailable",
    audience: "Paralegal",
    goal: "Secure a useful follow-up route.",
    script:
      "No problem. Would it make sense to include you on a short overview and arrange a quick demo when the attorney is available, or is there a better person to coordinate that with?",
    notes: "Keep the paralegal involved if they own the workflow pain.",
    buttons: buttons([
      ["Include me", "paralegal_email_captured"],
      ["Gives attorney contact", "paralegal_contact_obtained"],
      ["Schedule later", "paralegal_callback"],
      ["No interest", "paralegal_end_call"]
    ])
  },
  paralegal_team_review: {
    id: "paralegal_team_review",
    title: "Paralegal Team Review",
    audience: "Paralegal",
    goal: "Engage the workflow users and create a demo path.",
    script:
      "That makes sense. Your team would know quickly where this saves time. Would it be useful to show the packet workflow to the paralegal team first, then include the attorney for review and approval?",
    notes: "Treat the paralegal team as stakeholders, not a barrier.",
    buttons: buttons([
      ["Book team demo", "paralegal_book_demo"],
      ["Send details first", "paralegal_send_info"],
      ["Attorney must join", "paralegal_attorney_handles"],
      ["Not now", "paralegal_bad_timing"]
    ])
  },
  paralegal_process_works: {
    id: "paralegal_process_works",
    title: "Process Works",
    audience: "Paralegal",
    goal: "Leave a low-pressure follow-up option.",
    script:
      "Understood. If the workload changes or the firm wants to compare faster packet preparation later, may I send a concise overview for reference?",
    notes: "Accept success with their current process. Seek permission for future relevance only.",
    buttons: buttons([
      ["Send overview", "paralegal_send_info"],
      ["No thanks", "paralegal_end_call"]
    ])
  },
  paralegal_bad_timing: {
    id: "paralegal_bad_timing",
    title: "Bad Timing",
    audience: "Paralegal",
    goal: "Find a sensible follow-up window.",
    script:
      "Makes sense. Would it be better for me to send a short overview now and reconnect after your current filing deadlines?",
    notes: "Never pressure someone during an active deadline.",
    buttons: buttons([
      ["Send overview", "paralegal_send_info"],
      ["Set later follow-up", "paralegal_callback"],
      ["No follow-up", "paralegal_end_call"]
    ])
  },
  paralegal_too_busy: {
    id: "paralegal_too_busy",
    title: "Too Busy",
    audience: "Paralegal",
    goal: "Acknowledge workload and offer a low-friction next step.",
    script:
      "I understand. The workload is the reason this may matter, but I do not need to interrupt your day. Should I send a brief example and follow up at a better time?",
    notes: "Being busy is a possible pain signal, not permission to keep pitching.",
    buttons: buttons([
      ["Send example", "paralegal_send_info"],
      ["Follow up later", "paralegal_callback"],
      ["End call", "paralegal_end_call"]
    ])
  },
  paralegal_approval_rate: {
    id: "paralegal_approval_rate",
    title: "Approval Results",
    audience: "Paralegal",
    goal: "Avoid unsupported approval claims and return to workflow value.",
    script:
      "Approval depends on the merits and attorney strategy of each matter, so I would not promise an approval result. Coverable helps prepare organized, source-grounded work product for attorney review. Would seeing the workflow be useful?",
    notes: "Do not connect software use to guaranteed legal outcomes.",
    buttons: buttons([
      ["See demo", "paralegal_interested"],
      ["Attorney should review", "paralegal_attorney_handles"],
      ["Send information", "paralegal_send_info"],
      ["Not interested", "paralegal_end_call"]
    ])
  },
  paralegal_skeptical: {
    id: "paralegal_skeptical",
    title: "Still Skeptical",
    audience: "Paralegal",
    goal: "Offer proof through a reviewable demonstration.",
    script:
      "That is fair. Rather than asking you to trust a description, a short demo lets your team see the source-document workflow and decide whether the output is reviewable. Would that be worth showing to the appropriate attorney?",
    notes: "A skeptical paralegal deserves evidence, not extra claims.",
    buttons: buttons([
      ["Show attorney", "paralegal_book_demo"],
      ["Send details", "paralegal_send_info"],
      ["No", "paralegal_end_call"]
    ])
  },
  paralegal_relevant_practice: {
    id: "paralegal_relevant_practice",
    title: "Relevant Case Work",
    audience: "Paralegal",
    goal: "Convert relevant case volume into a focused demonstration.",
    script:
      "That is helpful. We can focus a short walkthrough on that type of matter and show how documents become drafts, organized exhibits, and a packet for review. Who should join that demonstration?",
    notes: "Keep the demo anchored to the matter type they identified.",
    buttons: buttons([
      ["Book demo", "paralegal_book_demo"],
      ["Include attorney", "paralegal_attorney_handles"],
      ["Send information first", "paralegal_send_info"],
      ["Ask about accuracy", "paralegal_accuracy"]
    ])
  },
  paralegal_pricing: {
    id: "paralegal_pricing",
    title: "Pricing Question",
    audience: "Paralegal",
    goal: "Qualify value before a pricing discussion.",
    script:
      "Pricing depends on the firm's workflow and use, so the right first step is seeing whether it would save meaningful preparation time for your cases. Who should join a quick demo and pricing conversation?",
    notes: "Do not invent price terms. Route pricing to a qualified conversation.",
    buttons: buttons([
      ["Book demo", "paralegal_book_demo"],
      ["Attorney decides", "paralegal_attorney_handles"],
      ["Send information", "paralegal_send_info"],
      ["Budget issue", "paralegal_budget"]
    ])
  },
  paralegal_budget: {
    id: "paralegal_budget",
    title: "Budget Concern",
    audience: "Paralegal",
    goal: "Tie evaluation to measurable labor savings.",
    script:
      "I understand. The useful question is whether saved drafting and assembly hours would justify the cost for your case volume. Would the attorney be open to evaluating that on a short walkthrough?",
    notes: "Stay respectful. A budget objection may require decision-maker evaluation.",
    buttons: buttons([
      ["Ask attorney", "paralegal_attorney_handles"],
      ["Book walkthrough", "paralegal_book_demo"],
      ["Send overview", "paralegal_send_info"],
      ["End call", "paralegal_end_call"]
    ])
  },
  paralegal_paralegal_use: {
    id: "paralegal_paralegal_use",
    title: "Paralegal Use",
    audience: "Paralegal",
    goal: "Explain their role in the workflow.",
    script:
      "Yes. Paralegals can use Coverable to organize source materials and prepare the packet workflow, while the attorney retains review and final control. Would you want to see what that process looks like?",
    notes: "Make the workflow supportive of their expertise.",
    buttons: buttons([
      ["Show me", "paralegal_interested"],
      ["Attorney must approve", "paralegal_attorney_handles"],
      ["Send information", "paralegal_send_info"]
    ])
  },
  paralegal_permissions: {
    id: "paralegal_permissions",
    title: "Permissions",
    audience: "Paralegal",
    goal: "Move detailed access questions to a proper walkthrough.",
    script:
      "We can walk through how firm users and attorney review work in the platform during a demonstration. Who should join so we can address your firm's access requirements accurately?",
    notes: "Do not speculate about a firm's desired permission setup on a cold call.",
    buttons: buttons([
      ["Book demo", "paralegal_book_demo"],
      ["Include attorney", "paralegal_attorney_handles"],
      ["Send details", "paralegal_send_info"]
    ])
  },
  paralegal_upload: {
    id: "paralegal_upload",
    title: "Document Upload",
    audience: "Paralegal",
    goal: "Explain the starting point and invite a visual demonstration.",
    script:
      "The workflow begins with the firm's supporting case documents. The platform uses them to organize exhibits and build reviewable drafting and packet materials. A short demo is the clearest way to see that process. Who should join?",
    notes: "Keep the explanation concrete without turning the call into implementation training.",
    buttons: buttons([
      ["Book demo", "paralegal_book_demo"],
      ["Ask confidentiality", "paralegal_confidentiality"],
      ["Send information", "paralegal_send_info"]
    ])
  },
  paralegal_documents: {
    id: "paralegal_documents",
    title: "Required Documents",
    audience: "Paralegal",
    goal: "Tie document inputs to their actual case type.",
    script:
      "The supporting documents depend on the type of matter and the packet your team is preparing. We can show the workflow on the case type most relevant to your firm. What matters do you handle most often?",
    notes: "Let the firm's practice determine the most relevant example.",
    buttons: buttons([
      ["Employment-based", "paralegal_relevant_practice"],
      ["Investor", "paralegal_relevant_practice"],
      ["Humanitarian / removal", "paralegal_relevant_practice"],
      ["Mixed", "paralegal_relevant_practice"]
    ])
  },
  paralegal_data_training: {
    id: "paralegal_data_training",
    title: "Client Data Training",
    audience: "Paralegal",
    goal: "Address the data-use concern directly.",
    script:
      "No. Client data is not used to train AI models. Coverable is built for confidential legal workflows and attorney review. Would you like security information for the reviewing attorney, or would a walkthrough be more useful?",
    notes: "Provide formal security materials in follow-up when requested.",
    buttons: buttons([
      ["Security information", "paralegal_security_info"],
      ["Attorney review", "paralegal_attorney_handles"],
      ["Walkthrough", "paralegal_interested"],
      ["Send email", "paralegal_send_info"]
    ])
  },
  paralegal_security_info: {
    id: "paralegal_security_info",
    title: "Security Follow-Up",
    audience: "Paralegal",
    goal: "Route security materials to the correct reviewer.",
    script:
      "Absolutely. Who should receive the security and workflow information, and what is the best email for them?",
    notes: "Record the specific security concern so follow-up addresses it.",
    buttons: buttons([
      ["Provides email", "paralegal_email_captured"],
      ["Attorney contact", "paralegal_contact_obtained"],
      ["General inbox", "paralegal_general_inbox"]
    ])
  },
  paralegal_contact_obtained: {
    id: "paralegal_contact_obtained",
    title: "Contact Identified",
    audience: "Paralegal",
    goal: "Turn the contact into a useful next step.",
    script:
      "Thank you. Would it make sense to include you when I send the overview, or should I reach out directly to that person about a quick packet-workflow demo?",
    notes: "Keep the paralegal involved when they are close to the day-to-day work.",
    buttons: buttons([
      ["Include paralegal", "paralegal_email_captured"],
      ["Reach out directly", "paralegal_email_captured"],
      ["Book demo", "paralegal_book_demo"],
      ["End call", "paralegal_end_call"]
    ])
  },
  paralegal_email_captured: {
    id: "paralegal_email_captured",
    title: "Email Captured",
    audience: "Paralegal",
    goal: "Confirm a targeted follow-up and possible demo.",
    script:
      "Perfect. I'll send a concise overview focused on reducing immigration packet preparation time and include a simple next step for a walkthrough.",
    notes: "Log the email, case type, named contact, and follow-up date in CRM.",
    buttons: buttons([
      ["Book demo now", "paralegal_book_demo"],
      ["Finish call", "call_complete"],
      ["Add callback", "paralegal_callback"]
    ])
  },
  paralegal_general_inbox: {
    id: "paralegal_general_inbox",
    title: "General Inbox",
    audience: "Paralegal",
    goal: "Get context to route a generic email.",
    script:
      "I can send it there. Whose attention should I put it to so the person responsible for immigration packet workflow sees it?",
    notes: "Ask for a name once, then respect the route they provide.",
    buttons: buttons([
      ["Gives name", "paralegal_email_captured"],
      ["Inbox only", "paralegal_email_captured"],
      ["No follow-up", "paralegal_end_call"]
    ])
  },
  paralegal_demo_details: {
    id: "paralegal_demo_details",
    title: "Demo Details Captured",
    audience: "Paralegal",
    goal: "Confirm the invite and attendees.",
    script:
      "Perfect. I'll send the invite and keep the walkthrough focused on how your team prepares immigration packets from supporting documents. Who else should be included?",
    notes: "Confirm time, email, attendees, and relevant case type in CRM.",
    buttons: buttons([
      ["Details complete", "call_complete"],
      ["Add attorney", "paralegal_contact_obtained"],
      ["Follow up later", "paralegal_callback"]
    ])
  },
  paralegal_callback: {
    id: "paralegal_callback",
    title: "Follow Up Later",
    audience: "Paralegal",
    goal: "Secure a real follow-up time.",
    script:
      "No problem. When would be a better time to reconnect, and should I send a short overview before then?",
    notes: "Log a date or time rather than leaving the follow-up vague.",
    buttons: buttons([
      ["Time captured", "call_complete"],
      ["Send first", "paralegal_send_info"],
      ["No follow-up", "paralegal_end_call"]
    ])
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

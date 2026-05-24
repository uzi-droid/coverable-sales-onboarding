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
    notes: "Choose the role as soon as you know it. Receptionist, paralegal, and attorney paths are ready for live use.",
    buttons: buttons([
      ["Secretary / Receptionist", "secretary_opening"],
      ["Paralegal", "paralegal_opening"],
      ["Attorney", "attorney_opening"],
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
      ["Attorney answers", "attorney_opening"],
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
  attorney_opening: {
    id: "attorney_opening",
    title: "Attorney Opener",
    audience: "Attorney",
    goal: "Introduce operational value and learn how the firm prepares packets today.",
    script:
      "Hey, this is [REP NAME] from Coverable. We work with immigration firms to automate petition drafting, exhibit organization, and filing-ready packet assembly. Firms use us to reduce dozens of hours of case prep into minutes. I wanted to briefly introduce the platform and see how your team currently handles immigration packet preparation.",
    notes:
      "Speak as an operational peer. Let the attorney choose the issue that matters: workflow, risk, security, economics, or next step.",
    buttons: buttons([
      ["We already have software", "attorney_software"],
      ["What exactly does it do?", "attorney_what_it_does"],
      ["Is this AI?", "attorney_ai"],
      ["How accurate is it?", "attorney_accuracy"],
      ["What case types?", "attorney_case_types"],
      ["Compare to competitor", "attorney_compare"],
      ["Can attorneys edit output?", "attorney_editing"],
      ["Does it cite sources?", "attorney_sources"],
      ["How much time does it save?", "attorney_time_savings"],
      ["Sounds expensive", "attorney_expensive"],
      ["How do you handle confidentiality?", "attorney_confidentiality"],
      ["Worried about hallucinations", "attorney_hallucinations"],
      ["How does onboarding work?", "attorney_onboarding"],
      ["Can my team collaborate?", "attorney_collaboration"],
      ["How technical is setup?", "attorney_setup"],
      ["We're too small", "attorney_small"],
      ["We're a large firm", "attorney_large"],
      ["Send me information", "attorney_send_information"],
      ["Interested / tell me more", "attorney_interested"],
      ["Book demo", "attorney_book_demo"],
      ["Not interested", "attorney_not_interested"]
    ])
  },
  attorney_software: {
    id: "attorney_software",
    title: "Existing Software",
    audience: "Attorney",
    goal: "Differentiate from case management.",
    script:
      "Most firms we speak with already use immigration software. Coverable is different because it does not just manage the case lifecycle. It actually generates the legal arguments, organizes the exhibits, builds the exhibit index, and assembles the filing-ready packet from the uploaded documents.",
    notes: "Ask what still consumes professional time; do not attack a platform they already selected.",
    buttons: buttons([
      ["Uses Docketwise", "attorney_existing_platform"],
      ["Uses INSZoom", "attorney_existing_platform"],
      ["Uses LawLogix", "attorney_existing_platform"],
      ["Uses PrimaFacie", "attorney_existing_platform"],
      ["Uses Clio", "attorney_existing_platform"],
      ["Internal / custom system", "attorney_existing_platform"],
      ["Software handles drafting", "attorney_software_automates"],
      ["Interested", "attorney_interested"],
      ["Not interested", "attorney_not_interested"]
    ])
  },
  attorney_what_it_does: {
    id: "attorney_what_it_does",
    title: "Product Explanation",
    audience: "Attorney",
    goal: "Give a clear, concise explanation.",
    script:
      "You upload the supporting documents, and the platform generates the cover letter or petition letter, drafts the legal argument, organizes the exhibits, creates the exhibit index, and outputs a reviewable filing-ready packet.",
    notes: "Stop after the workflow explanation and respond to the attorney's next concern.",
    buttons: buttons([
      ["Is this AI?", "attorney_ai"],
      ["How accurate is it?", "attorney_accuracy"],
      ["Which case types?", "attorney_case_types"],
      ["Can attorneys edit it?", "attorney_editing"],
      ["Does it cite source documents?", "attorney_sources"],
      ["Interested in demo", "attorney_interested"],
      ["Sounds expensive", "attorney_expensive"]
    ])
  },
  attorney_ai: {
    id: "attorney_ai",
    title: "AI Question",
    audience: "Attorney",
    goal: "Address hallucination concern.",
    script:
      "Yes, but the important distinction is that the workflows are deterministic and traceable to source documents. The goal is not to generate random legal text. The goal is to automate repetitive drafting and packet assembly while keeping the attorney fully in control of review.",
    notes: "Lead with control and traceability, not novelty.",
    buttons: buttons([
      ["Concerned about hallucinations", "attorney_hallucinations"],
      ["Concerned about ethics", "attorney_ethics"],
      ["Concerned about confidentiality", "attorney_confidentiality"],
      ["Technical explanation", "attorney_technical"],
      ["Interested in demo", "attorney_interested"]
    ])
  },
  attorney_accuracy: {
    id: "attorney_accuracy",
    title: "Accuracy and Review",
    audience: "Attorney",
    goal: "Frame Coverable as an attorney acceleration tool.",
    script:
      "The platform is designed to accelerate attorney review, not replace it. Every output is reviewable, editable, and traceable back to source documents so the attorney can verify the work product efficiently.",
    notes: "Do not promise case outcomes. Keep the focus on verifiable preparation work.",
    buttons: buttons([
      ["Asks about approval rate", "attorney_approval_rate"],
      ["Source traceability", "attorney_sources"],
      ["Editing", "attorney_editing"],
      ["Skeptical", "attorney_skeptical"],
      ["Interested", "attorney_interested"]
    ])
  },
  attorney_case_types: {
    id: "attorney_case_types",
    title: "Supported Matters",
    audience: "Attorney",
    goal: "Demonstrate breadth and identify the relevant workflow.",
    script:
      "We support many immigration workflows including O-1, EB-1, NIW, EB-2, EB-3, H-1B, L-1, TN, E-1, E-2, EB-5, business plans, motions, briefs, asylum, cancellation of removal, and supporting documentation workflows.",
    notes: "Move from breadth to the type of matter where their team loses time.",
    buttons: buttons([
      ["O-1 / EB-1", "attorney_case_relevant"],
      ["Investor visas", "attorney_case_relevant"],
      ["H-1B volume", "attorney_case_relevant"],
      ["Family-based", "attorney_case_relevant"],
      ["Removal / asylum", "attorney_case_relevant"],
      ["Mixed practice", "attorney_case_relevant"],
      ["Interested in demo", "attorney_interested"]
    ])
  },
  attorney_compare: {
    id: "attorney_compare",
    title: "Competitor Comparison",
    audience: "Attorney",
    goal: "Differentiate positioning.",
    script:
      "Most immigration platforms focus primarily on forms, CRM, or case management. Coverable focuses heavily on drafting automation, exhibit orchestration, legal argument generation, and filing-ready packet assembly.",
    notes: "Keep comparisons category-based and respectful unless the attorney specifies their workflow.",
    buttons: buttons([
      ["Docketwise comparison", "attorney_competitor_specific"],
      ["INSZoom comparison", "attorney_competitor_specific"],
      ["LawLogix comparison", "attorney_competitor_specific"],
      ["Technical differentiation", "attorney_technical"],
      ["Interested", "attorney_interested"]
    ])
  },
  attorney_editing: {
    id: "attorney_editing",
    title: "Attorney Control",
    audience: "Attorney",
    goal: "Reinforce attorney control.",
    script:
      "Absolutely. The platform is designed around attorney review workflows. Attorneys can edit the generated content, modify arguments, reorganize exhibits, and review the packet before filing.",
    notes: "Review control is central to the product's legal workflow position.",
    buttons: buttons([
      ["Word export", "attorney_export"],
      ["Collaboration", "attorney_collaboration"],
      ["Review workflow", "attorney_review_workflow"],
      ["Interested", "attorney_interested"]
    ])
  },
  attorney_sources: {
    id: "attorney_sources",
    title: "Source Traceability",
    audience: "Attorney",
    goal: "Emphasize traceability.",
    script:
      "Yes. The platform is designed so the generated work product traces back to the supporting evidence and uploaded source documents, allowing attorneys to verify factual support more efficiently.",
    notes: "This is usually best demonstrated visually with an actual workflow.",
    buttons: buttons([
      ["Wants demo", "attorney_interested"],
      ["Hallucination concern", "attorney_hallucinations"],
      ["How do uploads work?", "attorney_uploads"],
      ["Auditability", "attorney_auditability"]
    ])
  },
  attorney_time_savings: {
    id: "attorney_time_savings",
    title: "Time Savings",
    audience: "Attorney",
    goal: "Quantify operational return.",
    script:
      "Firms typically use Coverable because packet preparation, exhibit organization, and repetitive drafting can consume dozens of hours per case. The operational leverage becomes significant once firms see complete packets assemble automatically.",
    notes: "Tie economics to their case volume rather than promising one fixed result.",
    buttons: buttons([
      ["Asks pricing", "attorney_pricing"],
      ["Wants ROI explanation", "attorney_roi"],
      ["Interested in demo", "attorney_interested"],
      ["Skeptical", "attorney_skeptical"]
    ])
  },
  attorney_expensive: {
    id: "attorney_expensive",
    title: "Cost Concern",
    audience: "Attorney",
    goal: "Reframe around labor and scalability.",
    script:
      "Most firms evaluate it against attorney and paralegal time. Even partial automation of drafting and packet assembly can materially increase case throughput without expanding headcount.",
    notes: "Explore economics without arguing about a price before understanding fit.",
    buttons: buttons([
      ["Asks pricing", "attorney_pricing"],
      ["Budget issue", "attorney_budget"],
      ["Wants trial / demo", "attorney_interested"],
      ["Maybe later", "attorney_later"]
    ])
  },
  attorney_confidentiality: {
    id: "attorney_confidentiality",
    title: "Confidentiality",
    audience: "Attorney",
    goal: "Address legal confidentiality concerns.",
    script:
      "The platform was built specifically for law firms. Firms maintain isolated data environments, client data is not used for training, and the workflows are designed around attorney review and confidentiality considerations.",
    notes: "Offer proper security review materials rather than improvising technical assurances.",
    buttons: buttons([
      ["Security information", "attorney_security"],
      ["Technical explanation", "attorney_technical"],
      ["Wants email", "attorney_send_information"],
      ["Interested in demo", "attorney_interested"]
    ])
  },
  attorney_hallucinations: {
    id: "attorney_hallucinations",
    title: "Hallucination Concern",
    audience: "Attorney",
    goal: "Differentiate source-document workflows from generic AI.",
    script:
      "That concern makes sense. Coverable is designed differently from generic AI chat systems. The system is built around structured workflows and source-document-based generation so attorneys can verify the underlying support for the work product.",
    notes: "Treat skepticism as professionalism. Offer demonstration and evidence, not hype.",
    buttons: buttons([
      ["Technical explanation", "attorney_technical"],
      ["See an example", "attorney_interested"],
      ["Still skeptical", "attorney_skeptical"],
      ["Interested in demo", "attorney_interested"]
    ])
  },
  attorney_onboarding: {
    id: "attorney_onboarding",
    title: "Onboarding",
    audience: "Attorney",
    goal: "Reduce adoption friction.",
    script:
      "Most firms start with a live walkthrough using one of their actual workflows. The onboarding is typically focused on showing the drafting flow, exhibit organization flow, and review process.",
    notes: "Do not make implementation sound heavier than the first evaluation step.",
    buttons: buttons([
      ["Wants demo", "attorney_book_demo"],
      ["Wants pricing", "attorney_pricing"],
      ["Implementation details", "attorney_implementation"],
      ["Timeline", "attorney_timeline"]
    ])
  },
  attorney_collaboration: {
    id: "attorney_collaboration",
    title: "Team Collaboration",
    audience: "Attorney",
    goal: "Show operational infrastructure.",
    script:
      "Yes. Firms use Coverable collaboratively across attorneys, paralegals, clients, and other contributors involved in the case preparation process.",
    notes: "Invite workflow questions from firms with multiple contributors.",
    buttons: buttons([
      ["Permissions", "attorney_permissions"],
      ["Workflow management", "attorney_workflow_management"],
      ["Interested in demo", "attorney_interested"]
    ])
  },
  attorney_setup: {
    id: "attorney_setup",
    title: "Technical Setup",
    audience: "Attorney",
    goal: "Reduce adoption fear.",
    script:
      "The goal is operational simplicity. Firms upload documents and review generated work product. The workflow is designed for legal teams rather than technical users.",
    notes: "Keep the adoption conversation concrete and low-friction.",
    buttons: buttons([
      ["Implementation details", "attorney_implementation"],
      ["Wants demo", "attorney_interested"],
      ["Wants email", "attorney_send_information"]
    ])
  },
  attorney_small: {
    id: "attorney_small",
    title: "Small Firm",
    audience: "Attorney",
    goal: "Reframe around leverage.",
    script:
      "Smaller firms often benefit significantly because automation allows attorneys and paralegals to handle more matters without adding operational overhead.",
    notes: "Do not assume budget; let the attorney decide whether leverage matters.",
    buttons: buttons([
      ["Interested", "attorney_interested"],
      ["Budget concern", "attorney_budget"],
      ["Wants pricing", "attorney_pricing"],
      ["Wants demo", "attorney_book_demo"]
    ])
  },
  attorney_large: {
    id: "attorney_large",
    title: "Large Firm",
    audience: "Attorney",
    goal: "Position enterprise scalability.",
    script:
      "That's actually where firms often see major operational gains because repetitive drafting and packet assembly scale aggressively with volume.",
    notes: "Large firms may need security, integrations, and broader stakeholder review.",
    buttons: buttons([
      ["Enterprise discussion", "attorney_enterprise"],
      ["Wants demo", "attorney_book_demo"],
      ["Security review", "attorney_security"],
      ["Integration discussion", "attorney_integration"]
    ])
  },
  attorney_send_information: {
    id: "attorney_send_information",
    title: "Send Information",
    audience: "Attorney",
    goal: "Capture a relevant follow-up path.",
    script:
      "Absolutely. To make the information relevant, what immigration case types does your firm primarily handle?",
    notes: "Capture practice focus and email before ending the call.",
    buttons: buttons([
      ["Employment-based", "attorney_email_route"],
      ["Investor visas", "attorney_email_route"],
      ["Family-based", "attorney_email_route"],
      ["Removal / asylum", "attorney_email_route"],
      ["Mixed practice", "attorney_email_route"],
      ["Wants pricing", "attorney_pricing"],
      ["Wants demo", "attorney_book_demo"]
    ])
  },
  attorney_interested: {
    id: "attorney_interested",
    title: "Interested",
    audience: "Attorney",
    goal: "Transition toward a demonstration.",
    script:
      "The easiest way to understand the workflow is seeing a packet generated live from uploaded documents. Once attorneys see the cover letter, legal argument, exhibit index, and organized packet assemble together, the operational impact becomes much clearer.",
    notes: "Do not continue presenting. Convert interest into the appropriate evaluation meeting.",
    buttons: buttons([
      ["Book demo", "attorney_book_demo"],
      ["Wants pricing", "attorney_pricing"],
      ["Technical discussion", "attorney_technical"],
      ["Security information", "attorney_security"]
    ])
  },
  attorney_book_demo: {
    id: "attorney_book_demo",
    title: "Book Demo",
    audience: "Attorney",
    goal: "Schedule the walkthrough.",
    script:
      "Great. Who else from your team would make sense to include in the walkthrough, and what is the best email for the calendar invite?",
    notes: "Capture attendees, email, relevant workflow, and a concrete time.",
    buttons: buttons([
      ["Captured email", "attorney_demo_captured"],
      ["Email first", "attorney_email_route"],
      ["Later scheduling", "attorney_later"],
      ["Technical demo", "attorney_technical_demo"],
      ["Business-focused demo", "attorney_business_demo"]
    ])
  },
  attorney_not_interested: {
    id: "attorney_not_interested",
    title: "Not Interested",
    audience: "Attorney",
    goal: "Exit professionally while probing lightly.",
    script:
      "Understood completely. Just so I don't waste your time in the future, is it more that your current workflow is already working well, or that now simply isn't the right time to evaluate tools?",
    notes: "Accept the response. Ask only enough to improve future follow-up discipline.",
    buttons: buttons([
      ["Current workflow works", "attorney_current_workflow"],
      ["Timing issue", "attorney_timing"],
      ["Too busy", "attorney_busy"],
      ["Cost concern", "attorney_budget"],
      ["End call", "attorney_end_call"]
    ])
  },
  attorney_end_call: {
    id: "attorney_end_call",
    title: "End Call",
    audience: "Attorney",
    goal: "Close professionally.",
    script: "No problem at all. I appreciate your time. Have a great rest of your day.",
    notes: "Log the outcome and do not continue selling.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Restart", "call_start"]
    ])
  },
  attorney_existing_platform: {
    id: "attorney_existing_platform",
    title: "Existing Platform Workflow",
    audience: "Attorney",
    goal: "Discover what the current platform leaves manual.",
    script:
      "Understood. Does your current system produce the substantive first draft, organize the supporting evidence, and assemble the reviewable packet, or are attorneys and paralegals still doing parts of that manually?",
    notes: "Differentiate around work product and orchestration, not brand comparison.",
    buttons: buttons([
      ["Still manual", "attorney_workflow_pain"],
      ["Already automated", "attorney_software_automates"],
      ["Wants comparison", "attorney_compare"],
      ["Interested", "attorney_interested"]
    ])
  },
  attorney_software_automates: {
    id: "attorney_software_automates",
    title: "Already Automated",
    audience: "Attorney",
    goal: "Respect an apparently covered workflow.",
    script:
      "That is helpful to know. If your current system is already handling source-grounded drafting and organized packet assembly effectively, there may not be an immediate fit. Would a concise comparison be useful, or should I close this out?",
    notes: "A qualified no is better than an unnecessary pitch.",
    buttons: buttons([
      ["Send comparison", "attorney_email_route"],
      ["Brief demo", "attorney_book_demo"],
      ["Close out", "attorney_end_call"]
    ])
  },
  attorney_workflow_pain: {
    id: "attorney_workflow_pain",
    title: "Manual Work Remains",
    audience: "Attorney",
    goal: "Connect the remaining work to a focused demonstration.",
    script:
      "That's the operational gap we address. If a walkthrough showed your team how the drafting, evidence organization, and packet assembly could become review work instead of build work, would that be worth fifteen minutes?",
    notes: "Use the attorney's admitted manual burden as the reason to meet.",
    buttons: buttons([
      ["Book demo", "attorney_book_demo"],
      ["How accurate?", "attorney_accuracy"],
      ["Pricing", "attorney_pricing"],
      ["Send information", "attorney_send_information"]
    ])
  },
  attorney_competitor_specific: {
    id: "attorney_competitor_specific",
    title: "Specific Comparison",
    audience: "Attorney",
    goal: "Position Coverable without unsupported feature-by-feature claims.",
    script:
      "I would want to understand how you use that system before drawing a comparison. The relevant distinction is whether your team still manually drafts substantive work product and builds exhibit packets. Is that work already automated in your process?",
    notes: "Avoid unsupported competitor claims. Compare workflows, not marketing lists.",
    buttons: buttons([
      ["Still manual", "attorney_workflow_pain"],
      ["Automated", "attorney_software_automates"],
      ["Show difference", "attorney_interested"]
    ])
  },
  attorney_technical: {
    id: "attorney_technical",
    title: "Technical Discussion",
    audience: "Attorney",
    goal: "Move technical diligence into a focused evaluation.",
    script:
      "That is worth covering properly. A technical walkthrough can show the document inputs, generation workflow, traceability, review controls, and security questions together. Would you like to schedule that with anyone else from your team?",
    notes: "Do not improvise implementation or security details during initial outreach.",
    buttons: buttons([
      ["Schedule technical demo", "attorney_technical_demo"],
      ["Security first", "attorney_security"],
      ["Email information", "attorney_email_route"],
      ["Not now", "attorney_later"]
    ])
  },
  attorney_ethics: {
    id: "attorney_ethics",
    title: "Ethics Concern",
    audience: "Attorney",
    goal: "Keep professional responsibility and oversight central.",
    script:
      "That is an appropriate concern. Coverable is built as a preparation and review tool; it does not displace the attorney's professional judgment or responsibility for the final work product. Would a review-workflow demonstration be useful?",
    notes: "Respect the attorney's professional duty; never minimize ethical review.",
    buttons: buttons([
      ["See review workflow", "attorney_interested"],
      ["Security question", "attorney_confidentiality"],
      ["Still concerned", "attorney_end_call"],
      ["Send information", "attorney_email_route"]
    ])
  },
  attorney_approval_rate: {
    id: "attorney_approval_rate",
    title: "Approval Rate",
    audience: "Attorney",
    goal: "Avoid outcome promises.",
    script:
      "Approval depends on the facts, evidence, and legal strategy in each matter, so I would not suggest a software approval rate. The value here is accelerating preparation of reviewable, source-grounded work product.",
    notes: "Never promise immigration outcomes or imply automation determines approval.",
    buttons: buttons([
      ["See workflow", "attorney_interested"],
      ["Source traceability", "attorney_sources"],
      ["Not interested", "attorney_end_call"]
    ])
  },
  attorney_skeptical: {
    id: "attorney_skeptical",
    title: "Skeptical",
    audience: "Attorney",
    goal: "Offer a verifiable demonstration rather than more claims.",
    script:
      "Fair. The useful test is not a claim on a cold call; it is whether your team can inspect a document-based packet workflow and judge the resulting work product. Would a brief demonstration be reasonable?",
    notes: "Skepticism is best answered by a controlled review, not extra adjectives.",
    buttons: buttons([
      ["Demo", "attorney_book_demo"],
      ["Technical detail", "attorney_technical"],
      ["Send information", "attorney_email_route"],
      ["No", "attorney_end_call"]
    ])
  },
  attorney_case_relevant: {
    id: "attorney_case_relevant",
    title: "Relevant Matter Type",
    audience: "Attorney",
    goal: "Anchor a demonstration in actual firm work.",
    script:
      "That is useful context. We can keep a walkthrough focused on that workflow and show how supporting documents become draft work product, organized exhibits, and a packet for attorney review. Would that be worth scheduling?",
    notes: "A matter-specific walkthrough is stronger than a generic product tour.",
    buttons: buttons([
      ["Book walkthrough", "attorney_book_demo"],
      ["Accuracy concern", "attorney_accuracy"],
      ["Pricing", "attorney_pricing"],
      ["Send overview", "attorney_email_route"]
    ])
  },
  attorney_export: {
    id: "attorney_export",
    title: "Export Workflow",
    audience: "Attorney",
    goal: "Address delivery-format diligence in a demonstration.",
    script:
      "We should show the output and review flow directly so you can evaluate how generated material fits the way your firm finalizes filings. Would you like that included in a walkthrough?",
    notes: "Do not assert an export format without confirming the deployed product behavior.",
    buttons: buttons([
      ["Include in demo", "attorney_book_demo"],
      ["Email details", "attorney_email_route"],
      ["Review controls", "attorney_review_workflow"]
    ])
  },
  attorney_review_workflow: {
    id: "attorney_review_workflow",
    title: "Review Workflow",
    audience: "Attorney",
    goal: "Show oversight as the center of the workflow.",
    script:
      "The evaluation should focus on how generated materials are reviewed, edited, verified against sources, and finalized under attorney control. Would you be open to seeing that review path on a relevant matter type?",
    notes: "Attorney oversight is the product story here.",
    buttons: buttons([
      ["Book demo", "attorney_book_demo"],
      ["Traceability", "attorney_sources"],
      ["Security", "attorney_security"]
    ])
  },
  attorney_uploads: {
    id: "attorney_uploads",
    title: "Document Inputs",
    audience: "Attorney",
    goal: "Explain input-based workflow and move to demonstration.",
    script:
      "The workflow starts with supporting documents relevant to the matter. Those documents ground the drafting and exhibit-organization process, with attorney review before final use. A walkthrough is the best way to inspect it.",
    notes: "Keep input discussion connected to evidence traceability.",
    buttons: buttons([
      ["See walkthrough", "attorney_book_demo"],
      ["Confidentiality", "attorney_confidentiality"],
      ["Auditability", "attorney_auditability"]
    ])
  },
  attorney_auditability: {
    id: "attorney_auditability",
    title: "Auditability",
    audience: "Attorney",
    goal: "Make verification tangible.",
    script:
      "The point of source traceability is to make the drafted work product easier to verify against supporting evidence. We can show that review path directly in a technical or matter-focused walkthrough.",
    notes: "Let the attorney examine verification behavior in the product.",
    buttons: buttons([
      ["Technical walkthrough", "attorney_technical_demo"],
      ["Matter-focused demo", "attorney_business_demo"],
      ["Security review", "attorney_security"]
    ])
  },
  attorney_roi: {
    id: "attorney_roi",
    title: "ROI Discussion",
    audience: "Attorney",
    goal: "Tie automation to throughput without overpromising.",
    script:
      "The practical analysis is hours spent drafting and assembling packets today, multiplied across your matter volume. Reducing that preparation burden can free attorney and paralegal capacity for review, strategy, and additional matters.",
    notes: "Invite their workload numbers rather than inventing ROI.",
    buttons: buttons([
      ["Discuss volume in demo", "attorney_business_demo"],
      ["Pricing", "attorney_pricing"],
      ["Send information", "attorney_email_route"],
      ["Not now", "attorney_later"]
    ])
  },
  attorney_pricing: {
    id: "attorney_pricing",
    title: "Pricing",
    audience: "Attorney",
    goal: "Connect price evaluation to firm workflow and fit.",
    script:
      "Pricing is best evaluated against the workflow and matter volume it would support. If the platform reduces substantive preparation and packet assembly time for your team, we can discuss the economics clearly in a short walkthrough.",
    notes: "Do not fabricate pricing details; move to a qualified evaluation.",
    buttons: buttons([
      ["Schedule demo", "attorney_book_demo"],
      ["Budget concern", "attorney_budget"],
      ["Send pricing context", "attorney_email_route"],
      ["Later", "attorney_later"]
    ])
  },
  attorney_budget: {
    id: "attorney_budget",
    title: "Budget",
    audience: "Attorney",
    goal: "Respect budget while preserving a measurable evaluation path.",
    script:
      "Understood. It only makes sense if the saved preparation time and increased capacity justify it for the firm. Would a short evaluation be useful, or is it better to revisit this at a later point?",
    notes: "Do not pressure a budget concern.",
    buttons: buttons([
      ["Evaluate", "attorney_book_demo"],
      ["Revisit later", "attorney_later"],
      ["Send overview", "attorney_email_route"],
      ["End call", "attorney_end_call"]
    ])
  },
  attorney_security: {
    id: "attorney_security",
    title: "Security Review",
    audience: "Attorney",
    goal: "Route diligence to the right people and materials.",
    script:
      "Absolutely. Security and confidentiality review should be part of any evaluation involving client materials. Who should receive the security information, and would they join a technical walkthrough?",
    notes: "Capture the reviewer and requested materials for follow-up.",
    buttons: buttons([
      ["Send security material", "attorney_email_route"],
      ["Technical walkthrough", "attorney_technical_demo"],
      ["Include IT / operations", "attorney_enterprise"],
      ["Not now", "attorney_later"]
    ])
  },
  attorney_implementation: {
    id: "attorney_implementation",
    title: "Implementation Details",
    audience: "Attorney",
    goal: "Clarify adoption through a focused walkthrough.",
    script:
      "We can walk through document inputs, user workflow, attorney review, and any firm requirements in a short implementation-focused session. Who should be included in that conversation?",
    notes: "Implementation detail is a good reason to include operational stakeholders.",
    buttons: buttons([
      ["Schedule", "attorney_technical_demo"],
      ["Include operations", "attorney_enterprise"],
      ["Send details", "attorney_email_route"],
      ["Timeline", "attorney_timeline"]
    ])
  },
  attorney_timeline: {
    id: "attorney_timeline",
    title: "Evaluation Timeline",
    audience: "Attorney",
    goal: "Set expectations without overcommitting.",
    script:
      "The first step is a brief walkthrough to confirm workflow fit. After that, the timeline depends on the firm's review, security requirements, and the use case you want to evaluate.",
    notes: "Do not promise deployment timing before understanding requirements.",
    buttons: buttons([
      ["Schedule walkthrough", "attorney_book_demo"],
      ["Security first", "attorney_security"],
      ["Send overview", "attorney_email_route"]
    ])
  },
  attorney_permissions: {
    id: "attorney_permissions",
    title: "Permissions",
    audience: "Attorney",
    goal: "Bring access-control questions into diligence.",
    script:
      "That is the right question for a collaborative legal workflow. We can review user access, attorney oversight, and how your team would participate during a technical walkthrough.",
    notes: "Route detailed permission requirements into an accurate product review.",
    buttons: buttons([
      ["Technical walkthrough", "attorney_technical_demo"],
      ["Security review", "attorney_security"],
      ["Send information", "attorney_email_route"]
    ])
  },
  attorney_workflow_management: {
    id: "attorney_workflow_management",
    title: "Workflow Management",
    audience: "Attorney",
    goal: "Connect team operations to packet automation.",
    script:
      "The relevant question is how contributors prepare source materials, how drafting and exhibits are assembled, and how attorneys review the final work product. We can show that end-to-end workflow in a demonstration.",
    notes: "Keep the discussion tied to case preparation rather than generic CRM.",
    buttons: buttons([
      ["Show workflow", "attorney_book_demo"],
      ["Technical session", "attorney_technical_demo"],
      ["Send information", "attorney_email_route"]
    ])
  },
  attorney_enterprise: {
    id: "attorney_enterprise",
    title: "Enterprise Evaluation",
    audience: "Attorney",
    goal: "Identify enterprise stakeholders.",
    script:
      "For a higher-volume firm, it makes sense to involve the attorney owner of the workflow along with operations, technology, or security reviewers. Who should join an initial evaluation?",
    notes: "A larger firm needs coordinated evaluation, not a longer cold-call pitch.",
    buttons: buttons([
      ["Schedule stakeholder demo", "attorney_book_demo"],
      ["Security contact", "attorney_security"],
      ["Integration contact", "attorney_integration"],
      ["Email first", "attorney_email_route"]
    ])
  },
  attorney_integration: {
    id: "attorney_integration",
    title: "Integration Discussion",
    audience: "Attorney",
    goal: "Understand requirements without making unsupported commitments.",
    script:
      "Integration depends on the systems and workflow your firm wants to connect. I would rather review those requirements accurately in a technical session than give an incomplete answer now.",
    notes: "Never promise an integration before confirming it.",
    buttons: buttons([
      ["Technical session", "attorney_technical_demo"],
      ["Send requirements", "attorney_email_route"],
      ["Include technology team", "attorney_enterprise"]
    ])
  },
  attorney_current_workflow: {
    id: "attorney_current_workflow",
    title: "Workflow Working Well",
    audience: "Attorney",
    goal: "Leave respectfully when there is no present pain.",
    script:
      "Understood. If your preparation workflow changes or capacity becomes a constraint later, may I send a concise overview so you have the context?",
    notes: "Respect that the firm may not have an active need.",
    buttons: buttons([
      ["Send overview", "attorney_email_route"],
      ["No follow-up", "attorney_end_call"]
    ])
  },
  attorney_timing: {
    id: "attorney_timing",
    title: "Timing",
    audience: "Attorney",
    goal: "Find a non-intrusive follow-up point.",
    script:
      "That makes sense. Would a short overview now and a follow-up after your current filing priorities be reasonable, or would you prefer I close it out?",
    notes: "Do not make deadline pressure worse.",
    buttons: buttons([
      ["Follow up later", "attorney_later"],
      ["Send overview", "attorney_email_route"],
      ["Close out", "attorney_end_call"]
    ])
  },
  attorney_busy: {
    id: "attorney_busy",
    title: "Too Busy",
    audience: "Attorney",
    goal: "Respect time while preserving a simple evaluation path.",
    script:
      "Understood. I will not hold you now. Would it be appropriate to email a short overview and reconnect at a less demanding time?",
    notes: "Brevity here shows respect for attorney time.",
    buttons: buttons([
      ["Send email", "attorney_email_route"],
      ["Reconnect later", "attorney_later"],
      ["End call", "attorney_end_call"]
    ])
  },
  attorney_email_route: {
    id: "attorney_email_route",
    title: "Email Follow-Up",
    audience: "Attorney",
    goal: "Confirm targeted written follow-up.",
    script:
      "Perfect. What is the best email, and should I focus the overview on packet generation, source traceability, security, or the economics of reducing preparation time?",
    notes: "Log the email, requested focus, case type, and follow-up date in CRM.",
    buttons: buttons([
      ["Captured details", "attorney_email_captured"],
      ["Book demo now", "attorney_book_demo"],
      ["Later follow-up", "attorney_later"]
    ])
  },
  attorney_email_captured: {
    id: "attorney_email_captured",
    title: "Follow-Up Captured",
    audience: "Attorney",
    goal: "Close with a clear next step.",
    script:
      "Thank you. I will keep it focused on the workflow you identified and include a straightforward option for a walkthrough if it is relevant.",
    notes: "Send the promised material and log the exact follow-up step.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Schedule demo", "attorney_book_demo"],
      ["Set reminder", "attorney_later"]
    ])
  },
  attorney_demo_captured: {
    id: "attorney_demo_captured",
    title: "Demo Details Captured",
    audience: "Attorney",
    goal: "Confirm the scheduled evaluation.",
    script:
      "Excellent. I will send the invite and keep the walkthrough focused on your immigration packet workflow, including drafting, exhibits, source review, and the operational impact.",
    notes: "Confirm time, attendees, email, and demonstration focus in CRM.",
    buttons: buttons([
      ["Finish call", "call_complete"],
      ["Add stakeholder", "attorney_enterprise"],
      ["Security materials first", "attorney_security"]
    ])
  },
  attorney_later: {
    id: "attorney_later",
    title: "Later Follow-Up",
    audience: "Attorney",
    goal: "Set a precise, respectful next step.",
    script:
      "Of course. When would be appropriate for me to reconnect, and would a short overview beforehand be useful?",
    notes: "A real date is better than an indefinite follow-up.",
    buttons: buttons([
      ["Time captured", "call_complete"],
      ["Send overview first", "attorney_email_route"],
      ["No follow-up", "attorney_end_call"]
    ])
  },
  attorney_technical_demo: {
    id: "attorney_technical_demo",
    title: "Technical Walkthrough",
    audience: "Attorney",
    goal: "Schedule diligence on controls and workflow.",
    script:
      "Great. I will make the walkthrough focused on document inputs, generation, traceability, review controls, and security requirements. What is the best email for the invite, and who else should join?",
    notes: "Capture the technical questions in CRM so the demo addresses them.",
    buttons: buttons([
      ["Details captured", "attorney_demo_captured"],
      ["Security reviewer needed", "attorney_security"],
      ["Schedule later", "attorney_later"]
    ])
  },
  attorney_business_demo: {
    id: "attorney_business_demo",
    title: "Workflow and ROI Walkthrough",
    audience: "Attorney",
    goal: "Schedule an operations-focused demonstration.",
    script:
      "Great. I will keep the walkthrough focused on packet preparation time, attorney review, and capacity impact. What is the best email for the invite, and who else should be included?",
    notes: "Record matter type, volume context, and stakeholder list.",
    buttons: buttons([
      ["Details captured", "attorney_demo_captured"],
      ["Include operations", "attorney_enterprise"],
      ["Schedule later", "attorney_later"]
    ])
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

export const CRIMINAL_DEFENSE_SCRIPT_START_STATE_ID = "cd_secretary_opening";

function buttons(items) {
  return items.map(([label, nextStateId]) => ({ label, nextStateId }));
}

const openingButtons = [
  ["What is this regarding?", "cd_regarding"],
  ["Can you send an email?", "cd_email"],
  ["They're busy", "cd_busy"],
  ["We already use software", "cd_software"],
  ["We're not interested", "cd_not_interested"],
  ["Attorney is unavailable", "cd_unavailable"],
  ["What company was this?", "cd_company"],
  ["How did you get our number?", "cd_number"],
  ["We're too small", "cd_small"],
  ["We're a large firm", "cd_large"],
  ["Is this AI?", "cd_ai"],
  ["Does it integrate with our software?", "cd_integrations"],
  ["Can you explain exactly what it does?", "cd_explain"],
  ["Put me through", "cd_transfer"],
  ["Take a message", "cd_message"],
  ["Wrong person", "cd_wrong_person"],
  ["Send information first", "cd_send_info"],
  ["End call", "cd_end"]
];

const contactButtons = [
  ["Transfer me now", "cd_transfer"],
  ["Give direct email", "cd_contact_email"],
  ["Give direct extension", "cd_contact_extension"],
  ["Send information first", "cd_send_info"],
  ["They're unavailable", "cd_unavailable"]
];

const emailFinishButtons = [
  ["Email sent", "cd_email_sent"],
  ["Schedule follow-up call", "cd_callback"],
  ["Take a message", "cd_message"],
  ["End call", "cd_end"]
];

const interestButtons = [
  ["Transfer me now", "cd_transfer"],
  ["Send email", "cd_email"],
  ["Schedule callback", "cd_callback"],
  ["Take a message", "cd_message"]
];

export const criminalDefenseScriptStates = {
  cd_secretary_opening: {
    id: "cd_secretary_opening",
    title: "Receptionist Opener",
    audience: "Secretary / Receptionist",
    goal: "Reach the person responsible for criminal defense litigation workflow decisions.",
    script:
      "Hey, this is [REP NAME] from Coverable. We work with criminal defense firms to automate motion drafting, exhibit organization, and legal packet preparation. Who would be the best person to briefly speak with regarding litigation workflow software?",
    notes: "Keep this operational and brief. Your win is routing, contact information, or a useful follow-up path.",
    buttons: buttons(openingButtons)
  },
  cd_regarding: {
    id: "cd_regarding",
    title: "What is this regarding?",
    audience: "Secretary / Receptionist",
    goal: "Position the reason for calling without overexplaining.",
    script:
      "We work with criminal defense firms to reduce the time spent preparing motions, legal arguments, and organized exhibit packets. I was hoping to briefly connect with whoever oversees litigation workflows or legal operations.",
    notes: "Give enough relevance to be routed, then stop speaking.",
    buttons: buttons([
      ["Attorney handles this", "cd_attorney_handles"],
      ["Office manager handles this", "cd_manager_handles"],
      ["Paralegal handles this", "cd_paralegal_handles"],
      ["Send email", "cd_email"],
      ["They're unavailable", "cd_unavailable"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_email: {
    id: "cd_email",
    title: "Can you send an email?",
    audience: "Secretary / Receptionist",
    goal: "Obtain the right recipient instead of sending generic information.",
    script:
      "Absolutely. I just want to make sure I send it to the right person. Who typically evaluates workflow software or operational tools for the litigation team?",
    notes: "Try for a name, direct address, or role before accepting a general mailbox.",
    buttons: buttons([
      ["Gives attorney name", "cd_attorney_handles"],
      ["Gives office manager", "cd_manager_handles"],
      ["Gives paralegal", "cd_paralegal_handles"],
      ["Gives general inbox", "cd_general_inbox"],
      ["Refuses to give name", "cd_general_inbox"],
      ["Wants quick explanation first", "cd_explain"]
    ])
  },
  cd_busy: {
    id: "cd_busy",
    title: "They're busy",
    audience: "Secretary / Receptionist",
    goal: "Keep the opportunity alive without pressing for an immediate interruption.",
    script:
      "Totally understood. Usually firms ask us for a quick walkthrough because it can significantly reduce drafting and packet preparation time. Is there a better time to reconnect, or would email make more sense?",
    notes: "Respect the block. Secure a timed next step or a proper email route.",
    buttons: buttons([
      ["Suggests callback time", "cd_callback"],
      ["Offers voicemail", "cd_message"],
      ["Says send email", "cd_email"],
      ["Says not interested", "cd_not_interested"],
      ["Says try later", "cd_callback"]
    ])
  },
  cd_software: {
    id: "cd_software",
    title: "We already use software",
    audience: "Secretary / Receptionist",
    goal: "Differentiate Coverable from case management without turning this into a demo.",
    script:
      "Most firms we speak with already use some form of legal software. Coverable is different because it actually generates legal arguments, organizes exhibits, and assembles filing-ready litigation packets automatically.",
    notes: "The receptionist only needs the distinction and a routing request.",
    buttons: buttons([
      ["Uses Clio", "cd_software_named"],
      ["Uses MyCase", "cd_software_named"],
      ["Uses Filevine", "cd_software_named"],
      ["Uses PracticePanther", "cd_software_named"],
      ["Internal system", "cd_software_named"],
      ["Current software already handles this", "cd_software_drafting"],
      ["Interested", "cd_interested"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_software_named: {
    id: "cd_software_named",
    title: "Current Software Named",
    audience: "Secretary / Receptionist",
    goal: "Clarify the workflow layer and get routed.",
    script:
      "That makes sense. Coverable is focused on the drafting and packet-assembly work around motions, exhibits, and mitigation materials. Who would be best to speak with about that part of the workflow?",
    notes: "Do not critique their current software. Identify the responsible person.",
    buttons: buttons(contactButtons)
  },
  cd_software_drafting: {
    id: "cd_software_drafting",
    title: "Software Handles Drafting",
    audience: "Secretary / Receptionist",
    goal: "Respect the answer while finding the correct evaluator.",
    script:
      "Understood. The relevant comparison would be how it handles source documents, legal arguments, exhibits, and a complete filing-ready packet. Who reviews that workflow for the firm?",
    notes: "A technical comparison belongs with an attorney or operations lead.",
    buttons: buttons(contactButtons)
  },
  cd_not_interested: {
    id: "cd_not_interested",
    title: "We're not interested",
    audience: "Secretary / Receptionist",
    goal: "Lightly identify timing versus fit, then exit cleanly if needed.",
    script:
      "Understood completely. Just so I don't waste your time in the future, is it more that your current workflow is already working well, or that now simply isn't the right time to look at tools?",
    notes: "Do not argue. A useful reason or clean close is enough.",
    buttons: buttons([
      ["Current process works", "cd_process_works"],
      ["Timing issue", "cd_timing"],
      ["Too busy", "cd_busy"],
      ["Not decision maker", "cd_wrong_person"],
      ["Send info", "cd_send_info"],
      ["End call", "cd_end"]
    ])
  },
  cd_process_works: {
    id: "cd_process_works",
    title: "Current Process Works",
    audience: "Secretary / Receptionist",
    goal: "Leave a low-friction future path.",
    script:
      "That makes sense. If motion drafting or exhibit assembly ever becomes a bottleneck, would it be reasonable for me to send a brief overview for reference?",
    notes: "This is a permission question, not another pitch.",
    buttons: buttons([
      ["Send overview", "cd_send_info"],
      ["No thanks", "cd_end"],
      ["Who should receive it?", "cd_email"]
    ])
  },
  cd_timing: {
    id: "cd_timing",
    title: "Timing Issue",
    audience: "Secretary / Receptionist",
    goal: "Turn timing into a specific follow-up opportunity.",
    script:
      "Understood. Would a short email now and a brief follow-up later make sense, or is there a better time for me to reconnect?",
    notes: "Ask for one concrete next action.",
    buttons: buttons([
      ["Send email", "cd_email"],
      ["Schedule callback", "cd_callback"],
      ["No follow-up", "cd_end"]
    ])
  },
  cd_unavailable: {
    id: "cd_unavailable",
    title: "Attorney is unavailable",
    audience: "Secretary / Receptionist",
    goal: "Get contact details or a defined next attempt.",
    script:
      "No problem at all. Would it make more sense for me to send a quick overview first, or is there a better time to reconnect?",
    notes: "Accept unavailability while getting the next door opened.",
    buttons: buttons([
      ["Gives email", "cd_contact_email"],
      ["Gives callback time", "cd_callback"],
      ["Transfers to voicemail", "cd_message"],
      ["Unavailable indefinitely", "cd_email"],
      ["Office manager handles it", "cd_manager_handles"]
    ])
  },
  cd_company: {
    id: "cd_company",
    title: "What company was this?",
    audience: "Secretary / Receptionist",
    goal: "Restate Coverable clearly.",
    script:
      "Coverable. We help criminal defense firms automate motion drafting, exhibit organization, and filing-ready packet assembly.",
    notes: "Say the name clearly, then let the receptionist decide the route.",
    buttons: buttons([
      ["Asks what that means", "cd_explain"],
      ["Asks for website", "cd_website"],
      ["Send email", "cd_email"],
      ["Transfers call", "cd_transfer"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_website: {
    id: "cd_website",
    title: "Asks for Website",
    audience: "Secretary / Receptionist",
    goal: "Provide a low-friction reference and secure the contact path.",
    script:
      "Absolutely, it's coverable.ai. I can also send a short note to the person responsible for litigation workflow. Who would that be?",
    notes: "A website request is a routing opportunity, not a dismissal.",
    buttons: buttons([
      ["Gives contact", "cd_contact_email"],
      ["Use general inbox", "cd_general_inbox"],
      ["End call", "cd_end"]
    ])
  },
  cd_number: {
    id: "cd_number",
    title: "How did you get our number?",
    audience: "Secretary / Receptionist",
    goal: "Maintain legitimacy and move back to routing.",
    script:
      "We work specifically with criminal defense firms, and I came across your practice while researching litigation-focused firms.",
    notes: "Be direct. Do not sound evasive or over-explain prospecting.",
    buttons: buttons([
      ["Okay, continue", "cd_regarding"],
      ["Send email", "cd_email"],
      ["Not interested", "cd_not_interested"],
      ["Who are you trying to reach?", "cd_wrong_person"]
    ])
  },
  cd_small: {
    id: "cd_small",
    title: "We're too small",
    audience: "Secretary / Receptionist",
    goal: "Position leverage for lean firms.",
    script:
      "Honestly, smaller firms often benefit the most because it allows attorneys and staff to handle more matters without increasing operational overhead.",
    notes: "Keep it practical: capacity, not enterprise technology.",
    buttons: buttons([
      ["Interested", "cd_interested"],
      ["Budget concern", "cd_budget"],
      ["Send email", "cd_email"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_large: {
    id: "cd_large",
    title: "We're a large firm",
    audience: "Secretary / Receptionist",
    goal: "Position operational scale.",
    script:
      "That's actually where firms often see major operational gains because repetitive drafting and litigation packet assembly scale heavily with volume.",
    notes: "Offer a route to operations or technology evaluation.",
    buttons: buttons([
      ["Interested", "cd_interested"],
      ["Send email", "cd_email"],
      ["Wants enterprise contact", "cd_enterprise"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_enterprise: {
    id: "cd_enterprise",
    title: "Enterprise Routing",
    audience: "Secretary / Receptionist",
    goal: "Reach operations or technology leadership.",
    script:
      "Absolutely. Who oversees litigation operations or technology evaluation for the criminal defense practice, and what is the best way to reach them?",
    notes: "Capture the role, name, email, and extension when available.",
    buttons: buttons(contactButtons)
  },
  cd_budget: {
    id: "cd_budget",
    title: "Budget Concern",
    audience: "Secretary / Receptionist",
    goal: "Keep value framing brief and route to a decision maker.",
    script:
      "I understand. Firms usually evaluate this against the hours spent drafting motions and assembling supporting packets. Would it make sense to send a short overview to the person who reviews those decisions?",
    notes: "Do not discuss pricing through a gatekeeper.",
    buttons: buttons([
      ["Send email", "cd_email"],
      ["Gives decision maker", "cd_contact_email"],
      ["Not interested", "cd_end"]
    ])
  },
  cd_ai: {
    id: "cd_ai",
    title: "Is this AI?",
    audience: "Secretary / Receptionist",
    goal: "Address skepticism in one professional sentence.",
    script:
      "Yes, but the important distinction is that the workflows are designed specifically for legal drafting and litigation packet preparation rather than generic AI chat.",
    notes: "Risk questions should be routed to an attorney-level conversation.",
    buttons: buttons([
      ["Concerned about hallucinations", "cd_hallucinations"],
      ["Wants attorney to review", "cd_attorney_handles"],
      ["Interested", "cd_interested"],
      ["Send email", "cd_email"]
    ])
  },
  cd_hallucinations: {
    id: "cd_hallucinations",
    title: "AI Accuracy Concern",
    audience: "Secretary / Receptionist",
    goal: "Reassure briefly and invite attorney review.",
    script:
      "That's a fair concern. Coverable produces reviewable work product from source documents, with the attorney in control before anything is used. Would the attorney be the right person for a quick overview?",
    notes: "Do not debate legal risk with reception. Route it responsibly.",
    buttons: buttons([
      ["Connect attorney", "cd_transfer"],
      ["Send attorney email", "cd_email"],
      ["Not interested", "cd_end"]
    ])
  },
  cd_integrations: {
    id: "cd_integrations",
    title: "Does it integrate?",
    audience: "Secretary / Receptionist",
    goal: "Keep focus on drafting and packet automation.",
    script:
      "In many cases yes, but firms primarily use Coverable for the drafting automation and packet generation layer rather than traditional case management.",
    notes: "Technical specifics belong in a later discussion with the evaluator.",
    buttons: buttons([
      ["Wants technical contact", "cd_technical_contact"],
      ["Wants email", "cd_email"],
      ["Interested", "cd_interested"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_technical_contact: {
    id: "cd_technical_contact",
    title: "Technical Contact Requested",
    audience: "Secretary / Receptionist",
    goal: "Capture the right evaluator for an integration conversation.",
    script:
      "Happy to arrange that. Who from your litigation or technology team should receive the workflow and integration overview?",
    notes: "Get the contact, then move the technical conversation off the cold call.",
    buttons: buttons(contactButtons)
  },
  cd_explain: {
    id: "cd_explain",
    title: "Explain Coverable",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Choose the shortest explanation that suits the question.",
    script: "Choose an explanation length based on how much detail they actually requested.",
    notes: "Default to 15 seconds. Only expand when invited.",
    buttons: buttons([
      ["15-second explanation", "cd_explain_short"],
      ["45-second explanation", "cd_explain_medium"],
      ["Technical explanation", "cd_explain_technical"]
    ])
  },
  cd_explain_short: {
    id: "cd_explain_short",
    title: "15-Second Explanation",
    audience: "Secretary / Receptionist",
    goal: "Explain value quickly and return to routing.",
    script:
      "You upload litigation documents and the platform automatically generates legal arguments, organized exhibits, and filing-ready litigation packets.",
    notes: "After reading, ask to be routed rather than adding more product detail.",
    buttons: buttons([
      ["Interested", "cd_interested"],
      ["Send email", "cd_email"],
      ["Wants attorney", "cd_attorney_handles"],
      ["Wants demo", "cd_demo"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_explain_medium: {
    id: "cd_explain_medium",
    title: "45-Second Explanation",
    audience: "Secretary / Receptionist",
    goal: "Give a fuller operational description when invited.",
    script:
      "Coverable automates the most time-consuming parts of criminal defense preparation. Firms upload supporting documents and the platform generates motions, legal arguments, organized exhibits, and filing-ready packets automatically.",
    notes: "This is already enough detail for a receptionist conversation.",
    buttons: buttons([
      ["Interested", "cd_interested"],
      ["Send email", "cd_email"],
      ["Wants attorney", "cd_attorney_handles"],
      ["Wants demo", "cd_demo"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_explain_technical: {
    id: "cd_explain_technical",
    title: "Technical Explanation",
    audience: "Secretary / Receptionist",
    goal: "Provide technical positioning in one line.",
    script:
      "The system uses structured workflows and source-document-driven generation to automate litigation drafting and packet assembly workflows.",
    notes: "Move any deeper technical review to the appropriate firm contact.",
    buttons: buttons([
      ["Interested", "cd_interested"],
      ["Send email", "cd_email"],
      ["Wants attorney", "cd_attorney_handles"],
      ["Wants demo", "cd_demo"],
      ["Not interested", "cd_not_interested"]
    ])
  },
  cd_interested: {
    id: "cd_interested",
    title: "Interest Identified",
    audience: "Secretary / Receptionist",
    goal: "Convert interest into a warm handoff or direct follow-up.",
    script:
      "Great. The most useful next step is a short walkthrough with whoever oversees litigation workflow. Who should I coordinate that with?",
    notes: "Collect a name and direct route; do not perform the demo with the receptionist.",
    buttons: buttons(interestButtons)
  },
  cd_demo: {
    id: "cd_demo",
    title: "Requests Demo",
    audience: "Secretary / Receptionist",
    goal: "Identify attendees and scheduling contact.",
    script:
      "Absolutely. Who would be the right attorney or operations contact to include, and what is the best email for coordinating a walkthrough?",
    notes: "Capture the decision maker and calendar route.",
    buttons: buttons([
      ["Gives email", "cd_contact_email"],
      ["Transfers call", "cd_transfer"],
      ["Schedule callback", "cd_callback"],
      ["Send overview first", "cd_send_info"]
    ])
  },
  cd_transfer: {
    id: "cd_transfer",
    title: "Warm Transfer",
    audience: "Secretary / Receptionist",
    goal: "Move cleanly to the person who answers.",
    script: "Perfect, thank you.",
    notes: "Pause during the transfer, then select who picks up so the correct branch can continue.",
    buttons: buttons([
      ["Attorney branch", "cd_attorney_handoff"],
      ["Paralegal branch", "cd_paralegal_handoff"],
      ["Voicemail branch", "cd_message"]
    ])
  },
  cd_attorney_handles: {
    id: "cd_attorney_handles",
    title: "Attorney Handles It",
    audience: "Secretary / Receptionist",
    goal: "Reach or capture the responsible attorney.",
    script:
      "Got it. Could you connect me with the attorney who oversees the firm's criminal defense workflow, or share the best direct email for a brief overview?",
    notes: "A transfer is best; a direct contact is still a useful result.",
    buttons: buttons(contactButtons)
  },
  cd_manager_handles: {
    id: "cd_manager_handles",
    title: "Office Manager Handles It",
    audience: "Secretary / Receptionist",
    goal: "Reach the operational evaluator.",
    script:
      "That makes sense. Could you connect me with the office manager, or share the best email for a brief litigation workflow overview?",
    notes: "An operations contact may sponsor an attorney walkthrough.",
    buttons: buttons(contactButtons)
  },
  cd_paralegal_handles: {
    id: "cd_paralegal_handles",
    title: "Paralegal Handles It",
    audience: "Secretary / Receptionist",
    goal: "Reach the staff member closest to packet-preparation pain.",
    script:
      "Perfect. Could you connect me with the paralegal who handles motions or packet preparation, or share their direct email?",
    notes: "Paralegals may be strong internal advocates for this workflow.",
    buttons: buttons(contactButtons)
  },
  cd_message: {
    id: "cd_message",
    title: "Take a Message",
    audience: "Secretary / Receptionist",
    goal: "Leave a concise and legitimate callback reason.",
    script:
      "This is [REP NAME] from Coverable. We work with criminal defense firms to automate motion drafting and litigation packet preparation. My callback number is [NUMBER].",
    notes: "Speak slowly on the callback number. Avoid adding a second pitch.",
    buttons: buttons([
      ["Left message", "cd_message_left"],
      ["Send email too", "cd_email"],
      ["Call later", "cd_callback"]
    ])
  },
  cd_message_left: {
    id: "cd_message_left",
    title: "Message Left",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Log the message and select a follow-up.",
    script: "Record the message disposition and choose the next activity.",
    notes: "A callback task or targeted email prevents the lead from going cold.",
    buttons: buttons([
      ["Send email too", "cd_email"],
      ["Schedule callback", "cd_callback"],
      ["Complete attempt", "cd_complete"]
    ])
  },
  cd_wrong_person: {
    id: "cd_wrong_person",
    title: "Wrong Person",
    audience: "Secretary / Receptionist",
    goal: "Route to the correct litigation workflow contact.",
    script:
      "No worries at all. Who would usually oversee litigation workflows, drafting operations, or legal technology decisions at the firm?",
    notes: "Ask for the correct role even if a direct transfer is unavailable.",
    buttons: buttons([
      ["Gives attorney", "cd_attorney_handles"],
      ["Gives office manager", "cd_manager_handles"],
      ["Gives paralegal", "cd_paralegal_handles"],
      ["Doesn't know", "cd_general_inbox"],
      ["Send email", "cd_email"],
      ["End call", "cd_end"]
    ])
  },
  cd_send_info: {
    id: "cd_send_info",
    title: "Send Information First",
    audience: "Secretary / Receptionist",
    goal: "Tailor follow-up to the firm's criminal defense practice.",
    script:
      "Absolutely. To make the information relevant, what types of criminal defense matters does the firm primarily handle?",
    notes: "Use the answer to frame a targeted email and later callback.",
    buttons: buttons([
      ["Trial work", "cd_info_targeted"],
      ["Appeals", "cd_info_targeted"],
      ["Federal criminal defense", "cd_info_targeted"],
      ["State criminal defense", "cd_info_targeted"],
      ["Post-conviction work", "cd_info_targeted"],
      ["Mixed practice", "cd_info_targeted"],
      ["Refuses to answer", "cd_general_inbox"]
    ])
  },
  cd_info_targeted: {
    id: "cd_info_targeted",
    title: "Practice Focus Captured",
    audience: "Secretary / Receptionist",
    goal: "Get the recipient for relevant information.",
    script:
      "That's helpful. Who should I send a short, relevant overview to, and what is the best email address?",
    notes: "Log the practice focus with the contact route for follow-up.",
    buttons: buttons([
      ["Gets direct email", "cd_contact_email"],
      ["General inbox only", "cd_general_inbox"],
      ["Schedule callback", "cd_callback"],
      ["End call", "cd_end"]
    ])
  },
  cd_contact_email: {
    id: "cd_contact_email",
    title: "Direct Email Captured",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Send the brief overview and plan a follow-up.",
    script: "Record the contact name and direct email, then send the relevant Coverable overview.",
    notes: "Reference criminal defense drafting and packet workflows, not generic AI.",
    buttons: buttons(emailFinishButtons)
  },
  cd_contact_extension: {
    id: "cd_contact_extension",
    title: "Direct Extension Captured",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Save the route and create a direct follow-up attempt.",
    script: "Log the extension and the decision maker's role before scheduling a direct call.",
    notes: "A direct extension is a strong result from a gatekeeper conversation.",
    buttons: buttons([
      ["Call direct now", "cd_attorney_handoff"],
      ["Schedule callback", "cd_callback"],
      ["Send email also", "cd_email"]
    ])
  },
  cd_general_inbox: {
    id: "cd_general_inbox",
    title: "General Inbox",
    audience: "Secretary / Receptionist",
    goal: "Use the available route while creating a better follow-up path.",
    script:
      "No problem. I'll send a concise note there. Is there a particular attorney or operations contact I should address it to?",
    notes: "Accept the inbox if necessary, but make one last respectful attempt to personalize it.",
    buttons: buttons([
      ["Provides name", "cd_contact_email"],
      ["No name available", "cd_email_sent"],
      ["Schedule callback", "cd_callback"],
      ["End call", "cd_end"]
    ])
  },
  cd_email_sent: {
    id: "cd_email_sent",
    title: "Email Follow-Up",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Log the outbound follow-up and create a next step.",
    script: "Send the short overview and record a follow-up call task.",
    notes: "Email without a scheduled follow-up usually disappears.",
    buttons: buttons([
      ["Schedule callback", "cd_callback"],
      ["Complete attempt", "cd_complete"]
    ])
  },
  cd_callback: {
    id: "cd_callback",
    title: "Callback Timing",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Set a specific time to reconnect.",
    script: "Record the recommended callback window before moving to the next call.",
    notes: "A defined callback time is more useful than an unscheduled try-later disposition.",
    buttons: buttons([
      ["Later today", "cd_complete"],
      ["Tomorrow morning", "cd_complete"],
      ["Specified time captured", "cd_complete"],
      ["Send email also", "cd_email"]
    ])
  },
  cd_attorney_handoff: {
    id: "cd_attorney_handoff",
    title: "Attorney Connected",
    audience: "Attorney",
    mode: "prompt",
    goal: "Continue with the criminal defense attorney branch next.",
    script: "Attorney answered. The full Criminal Defense Attorney conversation will be built in the next branch.",
    notes: "Do not use an immigration script for a criminal defense prospect.",
    buttons: buttons([
      ["Return to receptionist flow", "cd_secretary_opening"],
      ["Complete attempt", "cd_complete"]
    ])
  },
  cd_paralegal_handoff: {
    id: "cd_paralegal_handoff",
    title: "Paralegal Connected",
    audience: "Paralegal",
    mode: "prompt",
    goal: "Continue with the criminal defense paralegal branch next.",
    script: "Paralegal answered. The full Criminal Defense Paralegal conversation will be built in the next branch.",
    notes: "Keep this practice area separate from the immigration workflow.",
    buttons: buttons([
      ["Return to receptionist flow", "cd_secretary_opening"],
      ["Complete attempt", "cd_complete"]
    ])
  },
  cd_complete: {
    id: "cd_complete",
    title: "Attempt Complete",
    audience: "Secretary / Receptionist",
    mode: "prompt",
    goal: "Log the outcome before the next dial.",
    script: "Record the contact, disposition, and next scheduled action in CRM.",
    notes: "Good routing data improves every later attempt.",
    buttons: buttons([
      ["Start new criminal defense call", "cd_secretary_opening"],
      ["End call", "cd_end"]
    ])
  },
  cd_end: {
    id: "cd_end",
    title: "End Call",
    audience: "Secretary / Receptionist",
    goal: "Close professionally.",
    script: "No problem at all. I appreciate your time. Have a great rest of your day.",
    notes: "End warmly and log the disposition.",
    buttons: buttons([
      ["Complete attempt", "cd_complete"],
      ["Start new criminal defense call", "cd_secretary_opening"]
    ])
  }
};

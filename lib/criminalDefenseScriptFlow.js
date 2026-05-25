export const CRIMINAL_DEFENSE_SCRIPT_START_STATE_ID = "cd_call_start";

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
  cd_call_start: {
    id: "cd_call_start",
    title: "New Criminal Defense Call",
    audience: "Unknown",
    mode: "prompt",
    goal: "Identify who answered and enter the correct criminal defense conversation.",
    script: "Who answered the phone?",
    notes: "Receptionist and paralegal flows are ready. The attorney branch will be developed next.",
    buttons: buttons([
      ["Secretary / Receptionist", "cd_secretary_opening"],
      ["Paralegal", "cd_paralegal_handoff"],
      ["Attorney", "cd_attorney_handoff"],
      ["Voicemail / No answer", "cd_message"]
    ])
  },
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
    title: "Paralegal Opener",
    audience: "Criminal Defense Paralegal",
    goal: "Learn whether this paralegal works in the workflows Coverable can improve.",
    script:
      "Hey, this is [REP NAME] from Coverable. We work with criminal defense firms to automate motion drafting, exhibit organization, and litigation packet preparation. Are you involved in preparing motions, exhibits, or case materials for the firm?",
    notes: "Do not bypass a paralegal who owns the pain. Qualify their workflow and earn an internal advocate.",
    buttons: buttons([
      ["Yes, I handle that", "cd_para_yes"],
      ["No, I don't handle that", "cd_para_no"],
      ["We already use software", "cd_para_software"],
      ["Attorney handles drafting", "cd_para_attorney_drafts"],
      ["We're not interested", "cd_para_not_interested"],
      ["Can you send an email?", "cd_para_email"],
      ["How does it work?", "cd_para_how_it_works"],
      ["Is this AI?", "cd_para_ai"],
      ["How accurate is it?", "cd_para_accuracy"],
      ["What types of packets?", "cd_para_packet_types"],
      ["Sounds expensive", "cd_para_expensive"],
      ["Does it organize exhibits?", "cd_para_exhibits"],
      ["How do you handle confidentiality?", "cd_para_confidentiality"],
      ["Interested / tell me more", "cd_para_interested"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_yes: {
    id: "cd_para_yes",
    title: "Handles Case Preparation",
    audience: "Criminal Defense Paralegal",
    goal: "Confirm workflow pain and introduce direct operational value.",
    script:
      "That's exactly the workflow we help with. Coverable can generate legal arguments, organize exhibits, structure mitigation materials, and assemble filing-ready packets automatically. A lot of firms use it to reduce repetitive drafting and packet prep time. How are you currently preparing litigation packets?",
    notes: "Listen for manual work, revision cycles, deadlines, and organization pain before asking for a demo.",
    buttons: buttons([
      ["Mostly manual", "cd_para_manual"],
      ["Attorney drafts everything", "cd_para_attorney_drafts"],
      ["We use templates", "cd_para_templates"],
      ["We use legal software", "cd_para_software"],
      ["Depends on case type", "cd_para_case_type"],
      ["Interested / tell me more", "cd_para_interested"],
      ["Not interested", "cd_para_not_interested"]
    ])
  },
  cd_para_manual: {
    id: "cd_para_manual",
    title: "Mostly Manual Workflow",
    audience: "Criminal Defense Paralegal",
    goal: "Identify the highest-friction manual task.",
    script:
      "That can become a heavy workload quickly. Where does the most time go right now: drafting motions, organizing discovery or exhibits, building mitigation packets, or formatting the final filing?",
    notes: "Their answer gives you the demo focus and language for attorney involvement.",
    buttons: buttons([
      ["Motion drafting", "cd_para_drafting_pain"],
      ["Discovery / exhibits", "cd_para_discovery_pain"],
      ["Mitigation packets", "cd_para_mitigation_pain"],
      ["Formatting filings", "cd_para_packet_pain"],
      ["All of it", "cd_para_interested"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_templates: {
    id: "cd_para_templates",
    title: "Uses Templates",
    audience: "Criminal Defense Paralegal",
    goal: "Differentiate template reuse from automated assembly.",
    script:
      "Templates help with consistency, but teams still have to move facts, evidence, arguments, and exhibits into the right structure manually. Coverable is meant to reduce that assembly work. Which part still takes the longest?",
    notes: "Respect existing process; expose the labor templates do not remove.",
    buttons: buttons([
      ["Drafting motions", "cd_para_drafting_pain"],
      ["Exhibits / discovery", "cd_para_discovery_pain"],
      ["Mitigation packets", "cd_para_mitigation_pain"],
      ["Process works fine", "cd_para_workflow_works"],
      ["Interested", "cd_para_interested"]
    ])
  },
  cd_para_case_type: {
    id: "cd_para_case_type",
    title: "Depends on Case Type",
    audience: "Criminal Defense Paralegal",
    goal: "Discover the best-fit workflow.",
    script:
      "That makes sense. Which matters create the heaviest preparation workload for your team: trials, sentencing and mitigation, appeals, federal cases, or post-conviction work?",
    notes: "Anchor the follow-up to a workflow they handle repeatedly.",
    buttons: buttons([
      ["Trial work", "cd_para_practice_fit"],
      ["Sentencing / mitigation", "cd_para_mitigation_pain"],
      ["Appeals", "cd_para_practice_fit"],
      ["Federal defense", "cd_para_practice_fit"],
      ["Post-conviction", "cd_para_practice_fit"],
      ["Mixed practice", "cd_para_practice_fit"]
    ])
  },
  cd_para_drafting_pain: {
    id: "cd_para_drafting_pain",
    title: "Drafting Pain",
    audience: "Criminal Defense Paralegal",
    goal: "Connect repetitive drafting pain to reviewable output.",
    script:
      "That is a strong fit for a walkthrough. Coverable is built to generate a reviewable first draft and supporting packet structure from the case materials, so the attorney is editing and approving rather than rebuilding repetitive sections.",
    notes: "Move toward a demo with the attorney and the paralegal together.",
    buttons: buttons([
      ["Interested in demo", "cd_para_demo"],
      ["Attorney should see it", "cd_para_attorney_involved"],
      ["How accurate is it?", "cd_para_accuracy"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_discovery_pain: {
    id: "cd_para_discovery_pain",
    title: "Discovery and Exhibit Pain",
    audience: "Criminal Defense Paralegal",
    goal: "Show value in document and evidence organization.",
    script:
      "That is one of the major workflow wins. Coverable organizes exhibits and supporting materials into a structured, reviewable packet so the team spends less time manually sorting and assembling evidence.",
    notes: "Discovery organization is often the paralegal's strongest reason to champion a demo.",
    buttons: buttons([
      ["Wants demo", "cd_para_demo"],
      ["Mitigation is also painful", "cd_para_mitigation_pain"],
      ["Attorney would review", "cd_para_attorney_involved"],
      ["Send email", "cd_para_send_info"]
    ])
  },
  cd_para_mitigation_pain: {
    id: "cd_para_mitigation_pain",
    title: "Mitigation Packet Pain",
    audience: "Criminal Defense Paralegal",
    goal: "Position structured mitigation assembly.",
    script:
      "Mitigation materials can become extremely time-consuming to organize. Coverable helps structure the materials, assemble exhibits, and build a reviewable packet around the legal argument for attorney finalization.",
    notes: "Use their real mitigation workflow as the proposed demo example.",
    buttons: buttons([
      ["Wants demo", "cd_para_demo"],
      ["Attorney needs to approve", "cd_para_attorney_involved"],
      ["Confidentiality concern", "cd_para_confidentiality"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_packet_pain: {
    id: "cd_para_packet_pain",
    title: "Packet Assembly Pain",
    audience: "Criminal Defense Paralegal",
    goal: "Frame the product around assembly time.",
    script:
      "Coverable is designed to remove a lot of that packet assembly work: organized exhibits, structured argument, and a complete reviewable PDF instead of manual compilation at the end.",
    notes: "A visible packet assembly demo is the clearest next step.",
    buttons: buttons([
      ["Interested in demo", "cd_para_demo"],
      ["Can attorneys edit it?", "cd_para_editing"],
      ["Sounds expensive", "cd_para_expensive"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_no: {
    id: "cd_para_no",
    title: "Does Not Handle It",
    audience: "Criminal Defense Paralegal",
    goal: "Route to the correct operational contact.",
    script:
      "No problem at all. Who usually handles motion preparation, discovery organization, or litigation packet workflows at the firm?",
    notes: "A named attorney or paralegal is more valuable than a generic inbox.",
    buttons: buttons([
      ["Attorney handles it", "cd_para_attorney_involved"],
      ["Another paralegal", "cd_para_other_paralegal"],
      ["Office manager", "cd_para_office_manager"],
      ["Send email", "cd_para_email"],
      ["Refuses / doesn't know", "cd_para_end"]
    ])
  },
  cd_para_other_paralegal: {
    id: "cd_para_other_paralegal",
    title: "Another Paralegal Handles It",
    audience: "Criminal Defense Paralegal",
    goal: "Secure a warm internal route.",
    script:
      "Got it. Would you be able to connect me with them, or share their email so I can keep the overview relevant to their litigation workflow?",
    notes: "Stay respectful; this contact may still influence the handoff.",
    buttons: buttons([
      ["Transfers me", "cd_paralegal_handoff"],
      ["Gives email", "cd_para_email_captured"],
      ["Send general inbox", "cd_para_general_inbox"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_office_manager: {
    id: "cd_para_office_manager",
    title: "Office Manager Route",
    audience: "Criminal Defense Paralegal",
    goal: "Get the operational buyer's path.",
    script:
      "That works. Could you connect me with the office manager or share their direct email for a short litigation workflow overview?",
    notes: "Mention attorney involvement later if the workflow affects filings.",
    buttons: buttons([
      ["Transfers me", "cd_manager_handles"],
      ["Gives email", "cd_para_email_captured"],
      ["Send general inbox", "cd_para_general_inbox"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_software: {
    id: "cd_para_software",
    title: "Already Uses Software",
    audience: "Criminal Defense Paralegal",
    goal: "Differentiate from case management tools.",
    script:
      "Totally. Most firms we speak with already use legal software. Coverable is different because it actually generates legal arguments, organizes exhibits, and assembles litigation packets rather than just managing the case lifecycle.",
    notes: "Ask where drafting and packet work still happens, not whether their system is good.",
    buttons: buttons([
      ["Uses Clio", "cd_para_software_named"],
      ["Uses MyCase", "cd_para_software_named"],
      ["Uses Filevine", "cd_para_software_named"],
      ["Uses PracticePanther", "cd_para_software_named"],
      ["Internal system", "cd_para_software_named"],
      ["Software already handles drafting", "cd_para_software_drafting"],
      ["Interested", "cd_para_interested"],
      ["Not interested", "cd_para_not_interested"]
    ])
  },
  cd_para_software_named: {
    id: "cd_para_software_named",
    title: "Current Software Identified",
    audience: "Criminal Defense Paralegal",
    goal: "Find the remaining manual workload.",
    script:
      "That makes sense. Does your team still manually draft motions or assemble exhibits and filing packets outside that system?",
    notes: "Their answer tells you whether the pain still exists.",
    buttons: buttons([
      ["Yes, still manual", "cd_para_manual"],
      ["Attorney handles it", "cd_para_attorney_drafts"],
      ["No, automated already", "cd_para_software_drafting"],
      ["Interested in comparison", "cd_para_demo"]
    ])
  },
  cd_para_software_drafting: {
    id: "cd_para_software_drafting",
    title: "Software Handles Drafting",
    audience: "Criminal Defense Paralegal",
    goal: "Probe lightly for fit without arguing.",
    script:
      "Understood. If it is already generating reviewable arguments, organizing exhibits, and producing complete filing-ready packets, you may be well covered. Would the attorney who reviews that workflow want a brief comparison, or should I leave it there?",
    notes: "Acknowledge a possible non-fit and let them choose the next step.",
    buttons: buttons([
      ["Attorney wants comparison", "cd_para_attorney_involved"],
      ["Send information", "cd_para_send_info"],
      ["No thanks", "cd_para_end"]
    ])
  },
  cd_para_attorney_drafts: {
    id: "cd_para_attorney_drafts",
    title: "Attorney Handles Drafting",
    audience: "Criminal Defense Paralegal",
    goal: "Position operational assistance without replacing judgment.",
    script:
      "Got it. Usually attorneys still review the final work product, but the repetitive drafting, organization, exhibit prep, and packet assembly still consume a lot of staff time. That's the part we help automate.",
    notes: "Do not imply that attorney judgment is automated away.",
    buttons: buttons([
      ["Attorney reviews everything", "cd_para_attorney_review"],
      ["Paralegal prepares first draft", "cd_para_first_draft"],
      ["Interested", "cd_para_interested"],
      ["Not interested", "cd_para_not_interested"],
      ["Wants attorney involved", "cd_para_attorney_involved"]
    ])
  },
  cd_para_attorney_review: {
    id: "cd_para_attorney_review",
    title: "Attorney Reviews Everything",
    audience: "Criminal Defense Paralegal",
    goal: "Reinforce attorney control and faster review.",
    script:
      "Absolutely. Coverable is built around that review model: the attorney stays in control, but begins with organized materials and a reviewable draft rather than a blank page and scattered exhibits.",
    notes: "Invite both attorney and paralegal to see the review workflow together.",
    buttons: buttons([
      ["Show attorney", "cd_para_attorney_involved"],
      ["Interested in demo", "cd_para_demo"],
      ["Accuracy concern", "cd_para_accuracy"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_first_draft: {
    id: "cd_para_first_draft",
    title: "Paralegal Prepares First Draft",
    audience: "Criminal Defense Paralegal",
    goal: "Connect the product directly to their workload.",
    script:
      "That is exactly where the workload reduction can be meaningful. Coverable can help generate the first draft and organized supporting packet so your time goes into quality control and case work rather than repeated assembly.",
    notes: "This is an internal-champion moment; ask for a workflow demo.",
    buttons: buttons([
      ["Interested in demo", "cd_para_demo"],
      ["Attorney should join", "cd_para_attorney_involved"],
      ["How accurate is it?", "cd_para_accuracy"],
      ["Sounds expensive", "cd_para_expensive"]
    ])
  },
  cd_para_not_interested: {
    id: "cd_para_not_interested",
    title: "Not Interested",
    audience: "Criminal Defense Paralegal",
    goal: "Discover the reason without arguing.",
    script:
      "Understood completely. Just so I don't waste your time in the future, is it more that your current process is already working well, or that now simply isn't the right time to evaluate tools?",
    notes: "Accept the answer. One useful disposition is enough.",
    buttons: buttons([
      ["Current workflow works", "cd_para_workflow_works"],
      ["Timing issue", "cd_para_timing"],
      ["Too busy", "cd_para_too_busy"],
      ["Not decision maker", "cd_para_attorney_involved"],
      ["Send info", "cd_para_send_info"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_workflow_works: {
    id: "cd_para_workflow_works",
    title: "Workflow Works",
    audience: "Criminal Defense Paralegal",
    goal: "Leave a professional future route.",
    script:
      "That makes sense. If motion prep, discovery organization, or packet assembly becomes a bottleneck later, would it be alright to send a short overview for reference?",
    notes: "Do not reopen the pitch; ask permission for a useful leave-behind.",
    buttons: buttons([
      ["Send overview", "cd_para_send_info"],
      ["No thanks", "cd_para_end"]
    ])
  },
  cd_para_timing: {
    id: "cd_para_timing",
    title: "Timing Issue",
    audience: "Criminal Defense Paralegal",
    goal: "Turn timing into an appropriate next action.",
    script:
      "Understood. Would a short overview now and a follow-up later make sense, or would you prefer I leave it there?",
    notes: "A respectful future date beats repeated unsolicited follow-ups.",
    buttons: buttons([
      ["Send overview", "cd_para_send_info"],
      ["Follow up later", "cd_para_follow_up"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_too_busy: {
    id: "cd_para_too_busy",
    title: "Too Busy",
    audience: "Criminal Defense Paralegal",
    goal: "Acknowledge the workload and offer low-friction follow-up.",
    script:
      "I understand. The workload is exactly why this may be relevant, but I do not need to take time now. Should I send a concise overview, or is there a better time for a short walkthrough?",
    notes: "Do not make being busy an excuse for a longer pitch.",
    buttons: buttons([
      ["Send overview", "cd_para_send_info"],
      ["Schedule later", "cd_para_follow_up"],
      ["Not interested", "cd_para_end"]
    ])
  },
  cd_para_email: {
    id: "cd_para_email",
    title: "Send an Email",
    audience: "Criminal Defense Paralegal",
    goal: "Get the correct contact and personalize follow-up.",
    script:
      "Absolutely. I just want to make sure I send the right version. Is the best person the attorney, office manager, or whoever oversees litigation workflows?",
    notes: "Prefer a direct recipient and a known workflow pain.",
    buttons: buttons([
      ["Gives attorney email", "cd_para_email_captured"],
      ["Gives paralegal email", "cd_para_email_captured"],
      ["Gives office manager", "cd_para_email_captured"],
      ["Gives general inbox", "cd_para_general_inbox"],
      ["Refuses name", "cd_para_end"]
    ])
  },
  cd_para_email_captured: {
    id: "cd_para_email_captured",
    title: "Email Captured",
    audience: "Criminal Defense Paralegal",
    mode: "prompt",
    goal: "Send a relevant overview and define the next touch.",
    script: "Record the contact and send a concise overview focused on criminal defense drafting and packet assembly.",
    notes: "Include the workflow they mentioned; generic follow-up is easy to ignore.",
    buttons: buttons([
      ["Email sent", "cd_para_follow_up"],
      ["Book demo now", "cd_para_demo"],
      ["Complete attempt", "cd_para_complete"]
    ])
  },
  cd_para_general_inbox: {
    id: "cd_para_general_inbox",
    title: "General Inbox Only",
    audience: "Criminal Defense Paralegal",
    goal: "Use the available route and try once for context.",
    script:
      "No problem. I'll send a concise note there. Is there a litigation workflow or packet type I should reference so it reaches the right person?",
    notes: "One targeted detail can make a generic inbox useful.",
    buttons: buttons([
      ["Gives workflow", "cd_para_send_info"],
      ["No additional detail", "cd_para_follow_up"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_how_it_works: {
    id: "cd_para_how_it_works",
    title: "How It Works",
    audience: "Criminal Defense Paralegal",
    goal: "Give a clear operational explanation.",
    script:
      "You upload litigation documents and supporting materials. Coverable organizes the exhibits, drafts the legal argument, structures the packet, and outputs a reviewable filing-ready PDF.",
    notes: "Keep it concrete: uploaded materials to reviewable output.",
    buttons: buttons([
      ["Is this AI?", "cd_para_ai"],
      ["How accurate is it?", "cd_para_accuracy"],
      ["Which packet types?", "cd_para_packet_types"],
      ["Can attorneys edit it?", "cd_para_editing"],
      ["Interested in demo", "cd_para_demo"],
      ["Sounds expensive", "cd_para_expensive"]
    ])
  },
  cd_para_ai: {
    id: "cd_para_ai",
    title: "Is This AI?",
    audience: "Criminal Defense Paralegal",
    goal: "Address AI concerns without sounding hype-driven.",
    script:
      "Yes, but the important distinction is that the workflows are designed specifically for legal drafting and litigation packet preparation rather than generic AI chat. The outputs are meant to be reviewable legal work product.",
    notes: "Respect legal-risk concerns and keep attorney oversight explicit.",
    buttons: buttons([
      ["Concerned about hallucinations", "cd_para_hallucinations"],
      ["Concerned about confidentiality", "cd_para_confidentiality"],
      ["Attorney would need to review", "cd_para_attorney_review"],
      ["Interested in demo", "cd_para_demo"]
    ])
  },
  cd_para_hallucinations: {
    id: "cd_para_hallucinations",
    title: "Hallucination Concern",
    audience: "Criminal Defense Paralegal",
    goal: "Reinforce review and source-based workflow.",
    script:
      "That concern is completely reasonable. Coverable is designed around source materials and attorney review; it reduces the repetitive preparation burden while leaving legal verification and final approval with the firm.",
    notes: "Offer to demonstrate the review process rather than claim risk disappears.",
    buttons: buttons([
      ["Wants review demo", "cd_para_demo"],
      ["Attorney should evaluate", "cd_para_attorney_involved"],
      ["Confidentiality concern", "cd_para_confidentiality"],
      ["Still skeptical", "cd_para_skeptical"]
    ])
  },
  cd_para_accuracy: {
    id: "cd_para_accuracy",
    title: "Accuracy Question",
    audience: "Criminal Defense Paralegal",
    goal: "Frame Coverable as attorney acceleration.",
    script:
      "The goal is not to replace attorney review. The goal is to eliminate repetitive drafting and packet assembly work so attorneys can review and finalize work more efficiently.",
    notes: "Avoid absolute claims. Focus on editable, reviewable workflow.",
    buttons: buttons([
      ["Skeptical", "cd_para_skeptical"],
      ["Interested", "cd_para_interested"],
      ["Wants demo", "cd_para_demo"],
      ["Asks about editing", "cd_para_editing"],
      ["Asks about review workflow", "cd_para_review_workflow"]
    ])
  },
  cd_para_skeptical: {
    id: "cd_para_skeptical",
    title: "Still Skeptical",
    audience: "Criminal Defense Paralegal",
    goal: "Invite evaluation without pressure.",
    script:
      "That is fair. The most useful way to evaluate it is to see a workflow and decide whether the output would actually reduce preparation time while remaining reviewable by the attorney.",
    notes: "A skeptical paralegal may be valuable if they agree to test the workflow honestly.",
    buttons: buttons([
      ["See a demo", "cd_para_demo"],
      ["Attorney should review", "cd_para_attorney_involved"],
      ["Send information", "cd_para_send_info"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_packet_types: {
    id: "cd_para_packet_types",
    title: "Packet Types",
    audience: "Criminal Defense Paralegal",
    goal: "Demonstrate breadth and identify relevance.",
    script:
      "We support workflows including trial briefs, plea negotiation packets, sentencing memorandums, bail and bond motions, pre-trial motions, appeal briefs, and post-conviction relief packets.",
    notes: "Ask which workflow is actually frequent or painful for this firm.",
    buttons: buttons([
      ["Trial work", "cd_para_practice_fit"],
      ["Appeals", "cd_para_practice_fit"],
      ["Federal criminal defense", "cd_para_practice_fit"],
      ["State criminal defense", "cd_para_practice_fit"],
      ["Post-conviction", "cd_para_practice_fit"],
      ["Interested in demo", "cd_para_demo"]
    ])
  },
  cd_para_practice_fit: {
    id: "cd_para_practice_fit",
    title: "Practice Fit Found",
    audience: "Criminal Defense Paralegal",
    goal: "Turn identified work into a relevant demonstration.",
    script:
      "That is helpful. A walkthrough can focus on that type of matter so you can judge whether the drafting, exhibit organization, and packet assembly would save your team meaningful time.",
    notes: "A specific workflow makes the demo credible.",
    buttons: buttons([
      ["Book demo", "cd_para_demo"],
      ["Attorney needs to attend", "cd_para_attorney_involved"],
      ["Send information first", "cd_para_send_info"],
      ["Ask pricing", "cd_para_expensive"]
    ])
  },
  cd_para_expensive: {
    id: "cd_para_expensive",
    title: "Sounds Expensive",
    audience: "Criminal Defense Paralegal",
    goal: "Reframe around labor savings.",
    script:
      "A lot of firms evaluate it against staff time spent preparing motions, exhibits, mitigation materials, and organized packets. Even partial automation can significantly reduce operational workload.",
    notes: "Do not quote pricing unless that process is defined; earn evaluation first.",
    buttons: buttons([
      ["Asks pricing", "cd_para_pricing"],
      ["Budget concern", "cd_para_budget"],
      ["Wants demo", "cd_para_demo"],
      ["Attorney decides", "cd_para_attorney_involved"]
    ])
  },
  cd_para_pricing: {
    id: "cd_para_pricing",
    title: "Pricing Asked",
    audience: "Criminal Defense Paralegal",
    goal: "Place pricing in workflow context.",
    script:
      "Pricing depends on the firm's workflow and usage. The useful first step is confirming whether it meaningfully reduces motion and packet preparation time for your team. Would a short walkthrough make sense?",
    notes: "Do not let an abstract price question replace a fit evaluation.",
    buttons: buttons([
      ["Book walkthrough", "cd_para_demo"],
      ["Attorney decides", "cd_para_attorney_involved"],
      ["Send information", "cd_para_send_info"],
      ["No budget", "cd_para_budget"]
    ])
  },
  cd_para_budget: {
    id: "cd_para_budget",
    title: "Budget Concern",
    audience: "Criminal Defense Paralegal",
    goal: "Respect constraints while preserving a useful route.",
    script:
      "Understood. If the team is losing significant time on drafting or packet assembly, it may still be worth showing the workflow to the attorney before ruling it out. Should I send a short overview or leave it there?",
    notes: "Budget is a valid issue; do not pressure a staff member.",
    buttons: buttons([
      ["Send overview", "cd_para_send_info"],
      ["Attorney can evaluate", "cd_para_attorney_involved"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_editing: {
    id: "cd_para_editing",
    title: "Attorney Editing",
    audience: "Criminal Defense Paralegal",
    goal: "Reinforce review workflow.",
    script:
      "Absolutely. The platform is designed around attorney review. Attorneys can edit arguments, reorganize exhibits, modify packet structure, and review everything before filing.",
    notes: "The firm retains control of every filing.",
    buttons: buttons([
      ["Interested", "cd_para_interested"],
      ["Wants attorney involved", "cd_para_attorney_involved"],
      ["Asks about collaboration", "cd_para_collaboration"],
      ["Asks about exports", "cd_para_exports"]
    ])
  },
  cd_para_review_workflow: {
    id: "cd_para_review_workflow",
    title: "Review Workflow",
    audience: "Criminal Defense Paralegal",
    goal: "Explain how staff and attorneys work together.",
    script:
      "The paralegal can help prepare and organize the case materials, and the attorney can review, edit, and approve the generated arguments and packet before any filing decision.",
    notes: "Position this as a controlled team workflow.",
    buttons: buttons([
      ["Interested in demo", "cd_para_demo"],
      ["Attorney should join", "cd_para_attorney_involved"],
      ["Confidentiality concern", "cd_para_confidentiality"]
    ])
  },
  cd_para_collaboration: {
    id: "cd_para_collaboration",
    title: "Collaboration",
    audience: "Criminal Defense Paralegal",
    goal: "Keep the focus on operational teamwork.",
    script:
      "The workflow is designed for legal teams to prepare materials and support attorney review. A demo can show how paralegal preparation and attorney finalization fit together.",
    notes: "Detailed permissions can be handled in a technical follow-up.",
    buttons: buttons([
      ["Book demo", "cd_para_demo"],
      ["Technical discussion", "cd_para_technical"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_exports: {
    id: "cd_para_exports",
    title: "Output and Export",
    audience: "Criminal Defense Paralegal",
    goal: "Clarify deliverable format without overselling.",
    script:
      "Coverable outputs organized, reviewable packet materials and PDFs for the team's filing workflow. The walkthrough can show the final packet structure and editing process.",
    notes: "Show the actual output in a demonstration.",
    buttons: buttons([
      ["See demo", "cd_para_demo"],
      ["Attorney should review", "cd_para_attorney_involved"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_exhibits: {
    id: "cd_para_exhibits",
    title: "Exhibit Organization",
    audience: "Criminal Defense Paralegal",
    goal: "Highlight a concrete operational improvement.",
    script:
      "Yes. One of the biggest workflow improvements is automatic exhibit organization and packet assembly. Firms spend enormous amounts of time manually organizing supporting materials.",
    notes: "Invite the paralegal to identify which packets create the most sorting work.",
    buttons: buttons([
      ["Interested", "cd_para_interested"],
      ["Discovery organization pain", "cd_para_discovery_pain"],
      ["Mitigation packet pain", "cd_para_mitigation_pain"],
      ["Wants demo", "cd_para_demo"],
      ["Wants email", "cd_para_send_info"]
    ])
  },
  cd_para_confidentiality: {
    id: "cd_para_confidentiality",
    title: "Confidentiality Concern",
    audience: "Criminal Defense Paralegal",
    goal: "Address confidentiality carefully.",
    script:
      "The platform was built specifically for law firms, with isolated environments and workflows designed around attorney review and confidentiality considerations.",
    notes: "Security review belongs with the firm decision maker; offer proper material rather than broad assurances.",
    buttons: buttons([
      ["Wants security info", "cd_para_security_info"],
      ["Wants attorney review", "cd_para_attorney_involved"],
      ["Send email", "cd_para_send_info"],
      ["Interested in demo", "cd_para_demo"]
    ])
  },
  cd_para_security_info: {
    id: "cd_para_security_info",
    title: "Security Information",
    audience: "Criminal Defense Paralegal",
    goal: "Route security material to the evaluator.",
    script:
      "Absolutely. I can send security and workflow information to whoever reviews technology and confidentiality for the firm. Who should receive it?",
    notes: "Capture the appropriate attorney or operational contact.",
    buttons: buttons([
      ["Attorney email", "cd_para_email_captured"],
      ["Office manager email", "cd_para_email_captured"],
      ["General inbox", "cd_para_general_inbox"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_interested: {
    id: "cd_para_interested",
    title: "Interest Identified",
    audience: "Criminal Defense Paralegal",
    goal: "Move toward a relevant demonstration.",
    script:
      "The easiest way to understand it is seeing a packet assembled live from uploaded litigation materials. Once firms see the legal argument, exhibits, and organized packet generate together, the operational impact becomes much clearer.",
    notes: "Treat the paralegal as a potential champion and invite the attorney as appropriate.",
    buttons: buttons([
      ["Book demo", "cd_para_demo"],
      ["Wants attorney involved", "cd_para_attorney_involved"],
      ["Wants pricing", "cd_para_pricing"],
      ["Wants technical discussion", "cd_para_technical"]
    ])
  },
  cd_para_demo: {
    id: "cd_para_demo",
    title: "Book Demo",
    audience: "Criminal Defense Paralegal",
    goal: "Schedule a useful walkthrough.",
    script:
      "Great. Who else from the team would make sense to include in the walkthrough, and what's the best email for the invite?",
    notes: "Aim to include the paralegal and an attorney who approves filings or technology.",
    buttons: buttons([
      ["Captured email", "cd_para_demo_captured"],
      ["Wants attorney approval", "cd_para_attorney_involved"],
      ["Wants later scheduling", "cd_para_follow_up"],
      ["Wants technical demo", "cd_para_technical"]
    ])
  },
  cd_para_demo_captured: {
    id: "cd_para_demo_captured",
    title: "Demo Details Captured",
    audience: "Criminal Defense Paralegal",
    mode: "prompt",
    goal: "Confirm invite and finish the call.",
    script: "Record the attendees, email address, workflow focus, and agreed demo time before sending the invite.",
    notes: "A demo tied to their pain is more likely to be attended.",
    buttons: buttons([
      ["Invite sent", "cd_para_complete"],
      ["Add attorney attendee", "cd_para_attorney_involved"],
      ["Send information first", "cd_para_send_info"]
    ])
  },
  cd_para_attorney_involved: {
    id: "cd_para_attorney_involved",
    title: "Attorney Involvement",
    audience: "Criminal Defense Paralegal",
    goal: "Bring in the attorney without sidelining the paralegal.",
    script:
      "Absolutely. It usually makes sense for the attorney and the paralegal closest to preparation work to see it together. Who would be the right attorney to include, and what is the best email for coordinating that?",
    notes: "Keep the paralegal included; they understand the operational impact.",
    buttons: buttons([
      ["Provides attorney email", "cd_para_demo_captured"],
      ["Will forward internally", "cd_para_send_info"],
      ["Attorney unavailable", "cd_para_follow_up"],
      ["No interest", "cd_para_end"]
    ])
  },
  cd_para_technical: {
    id: "cd_para_technical",
    title: "Technical Discussion",
    audience: "Criminal Defense Paralegal",
    goal: "Arrange the right technical review.",
    script:
      "Happy to cover that in a walkthrough. We can focus on source documents, packet output, review controls, and how the workflow fits the firm's process. Who should be included?",
    notes: "Avoid deep technical promises on an unscheduled cold call.",
    buttons: buttons([
      ["Book technical demo", "cd_para_demo"],
      ["Include attorney", "cd_para_attorney_involved"],
      ["Send information", "cd_para_send_info"]
    ])
  },
  cd_para_send_info: {
    id: "cd_para_send_info",
    title: "Send Information",
    audience: "Criminal Defense Paralegal",
    goal: "Capture practice focus for relevant follow-up.",
    script:
      "Absolutely. To make the information relevant, what type of criminal defense matters does the firm primarily handle?",
    notes: "Tailor the follow-up around an actual packet workflow.",
    buttons: buttons([
      ["Trial work", "cd_para_info_captured"],
      ["Appeals", "cd_para_info_captured"],
      ["Federal criminal defense", "cd_para_info_captured"],
      ["State criminal defense", "cd_para_info_captured"],
      ["Post-conviction", "cd_para_info_captured"],
      ["Mixed practice", "cd_para_info_captured"],
      ["Does not say", "cd_para_general_inbox"]
    ])
  },
  cd_para_info_captured: {
    id: "cd_para_info_captured",
    title: "Relevant Follow-Up",
    audience: "Criminal Defense Paralegal",
    goal: "Capture recipient and timing.",
    script:
      "That helps. What is the best email for a short overview focused on that workflow, and would following up after you review it be reasonable?",
    notes: "Get a direct route and permission for the next touch.",
    buttons: buttons([
      ["Provides email", "cd_para_email_captured"],
      ["General inbox", "cd_para_general_inbox"],
      ["Book demo instead", "cd_para_demo"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_follow_up: {
    id: "cd_para_follow_up",
    title: "Follow-Up Timing",
    audience: "Criminal Defense Paralegal",
    mode: "prompt",
    goal: "Log a specific follow-up action.",
    script: "Record the agreed follow-up timing and any workflow details mentioned during the call.",
    notes: "Do not lose the pain point that made follow-up relevant.",
    buttons: buttons([
      ["Follow-up scheduled", "cd_para_complete"],
      ["Send information first", "cd_para_send_info"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_complete: {
    id: "cd_para_complete",
    title: "Paralegal Attempt Complete",
    audience: "Criminal Defense Paralegal",
    mode: "prompt",
    goal: "Close the completed attempt and move to the next dial.",
    script: "Confirm the outcome and any next action before starting the next call.",
    notes: "Completed Script attempts count toward call analytics automatically when restarted.",
    buttons: buttons([
      ["Start new criminal defense call", "cd_call_start"],
      ["End call", "cd_para_end"]
    ])
  },
  cd_para_end: {
    id: "cd_para_end",
    title: "End Call",
    audience: "Criminal Defense Paralegal",
    goal: "Close professionally.",
    script: "No problem at all. I appreciate your time. Have a great rest of your day.",
    notes: "End with professionalism and record the outcome.",
    buttons: buttons([
      ["Complete attempt", "cd_para_complete"],
      ["Start new criminal defense call", "cd_call_start"]
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
      ["Start new criminal defense call", "cd_call_start"],
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
      ["Start new criminal defense call", "cd_call_start"]
    ])
  }
};

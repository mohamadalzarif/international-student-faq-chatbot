/**
 * Comprehensive FAQ content for the international student chatbot.
 *
 * This module stores answers to common questions asked by visiting or
 * international students at AUC. Each key corresponds to a topic and the
 * value contains a plain‑text answer summarising up‑to‑date guidance from
 * official AUC sources (citations are embedded as comments to preserve
 * traceability).  Do not include confidential or personal data in these
 * answers; the file is loaded directly into the user’s browser.
 */
const faqData = {
  /**
   * Arrival guidance: summarises official AUC instructions for study‑abroad
   * students travelling to Egypt. Advising and course registration are handled
   * by IPSO before you arrive. Keep your passport and admission letter with
   * you, and do not send personal documents via this chatbot.
   */
  "arrival":
    "AUC’s International Programs and Services Office (IPSO) registers visiting students before they arrive in Cairo – there is no online self‑registration for study‑abroad students【130122837438368†L141-L149】. Make sure your passport is valid for at least six months beyond your arrival and carry your admission letter. Many nationalities (e.g. U.S., Canada, Australia and most EU) can purchase a one‑month tourist visa on arrival; others such as Polish, Portuguese and Finnish citizens must apply for an entry visa in advance【745837844494780†L136-L171】. Once in Egypt, take the free AUC airport shuttle by emailing carpool@aucegypt.edu; show your acceptance letter and passport to board【130122837438368†L162-L170】. International Student Orientation is held the week before classes; you will obtain your AUC ID card and student visa, take placement tests, complete late registration and learn about campus services. Orientation includes campus tours and guidance from International Peer Leaders, and an optional 20‑hour survival Arabic course for about USD $280【130122837438368†L173-L189】. Keep emergency contacts handy but do not send personal documents through this chatbot.",

  /**
   * Visa and residency information: explains pre‑departure visas, on‑arrival
   * requirements, fees and the role of the Business Support Office. Always
   * confirm the latest requirements with students.residency@aucegypt.edu.
   */
  "visa":
    "Before departure, apply for a 90‑day entry visa at an Egyptian consulate and state that your purpose is study; some nationals can instead buy a one‑month tourist visa on arrival for about $25【745837844494780†L136-L171】. Passports must be valid at least six months beyond arrival. After you arrive, some nationalities must register their passports within seven days and pay a small fee; all students must complete the Business Support Form and follow the Business Support Office’s (BSO) instructions【745837844494780†L274-L289】. Government fees are roughly EGP 7 100 for tourist‑visa renewal, EGP 850 for a re‑entry visa and EGP 7 100 for a residency visa, with a late fine of EGP 1 685【745837844494780†L291-L301】. Residency approvals are valid for up to four years and residency cards must be renewed annually【745837844494780†L304-L337】. Always contact students.residency@aucegypt.edu for up‑to‑date guidance; do not share passport scans via this bot.",

  /**
   * Housing: describes the on‑campus housing process and off‑campus advice.
   */
  "housing":
    "First‑year students are required to live on campus through the First‑Year Residential Experience (FYRE) program【689151318865543†L142-L148】. To apply for AUC housing, wait for an email from the Office of Residential Life announcing application dates. After securing admission, create and activate your AUC email account, then log into the StarRez portal with your AUC username to select a room and sign a housing contract【689151318865543†L166-L174】. Continuing, graduate and exchange students follow the same portal procedure and will receive move‑in instructions and final housing requirements by email before the semester begins【689151318865543†L186-L199】. On move‑in day, pick up your ID card, obtain your room key and learn about spare‑key policies; always follow housing guidelines【656789696840349†L155-L161】. For off‑campus options, IPSO can suggest trusted resources, but you remain responsible for lease agreements.",

  /**
   * Registration: outlines how visiting students register, credit loads and
   * course eligibility. IPSO handles the registration after you submit a
   * Preliminary Course Planning form.
   */
  "registration":
    "IPSO registers visiting international students; you must submit a Preliminary Course Planning (PCP) form during the advising period listing your preferred courses【316441976852860†L143-L177】. IPSO obtains departmental approval and enrols you – there is no self‑registration for study‑abroad students. Undergraduate visitors generally register during the early‑registration period and have a drop/add period; graduate students register during on‑site orientation【316441976852860†L178-L205】. A full‑time load is 12–15 credits for undergraduates and 9 credits for graduate students. Overloads require approval and are limited to 18 credits for undergraduates and 12 credits for graduate students【316441976852860†L167-L177】. Undergraduates may take 1000–4000‑level courses and some 5100‑level courses; graduate visitors must take 5000‑ or 6000‑level courses but may include one 3‑credit Arabic language course if they complete the ALNG background form【316441976852860†L249-L259】【316441976852860†L256-L297】. PCP deadlines are usually 1 June for fall and 1 December for spring. Check the dynamic schedule and course catalogue and email ipso@aucegypt.edu with questions.",

  /**
   * Insurance: details the mandatory health‑insurance plan, coverage, fees and
   * contact information for GlobeMed Egypt.
   */
  "insurance":
    "All international students at AUC are automatically enrolled in the university’s comprehensive health insurance plan administered by Libano‑Suisse Takaful; there are no waivers and coverage is valid only within Egypt【120792988157332†L134-L145】. The plan covers emergency medical and non‑medical evacuation, repatriation of remains, hospital treatment, ambulance transport, doctor visits and prescribed medications【120792988157332†L147-L159】. Fees for the 2025–2026 academic year are approximately $172 for fall, $29 for winter, $172 for spring and $29 for summer sessions【120792988157332†L166-L190】. You can access your digital insurance card through the GlobeMed Fit app and must show it when seeking care. For prior approvals email approvals@globemedegypt.com; for chronic medications email chronic@globemedegypt.com; for reimbursements email reimbursement@globemedegypt.com; and for complaints email complaints@globemedegypt.com【120792988157332†L193-L257】. The GlobeMed hotline is 16784 and WhatsApp support is +2 010 6666 9888. In medical emergencies, contact campus medical services or call the public emergency numbers listed in the ‘Emergency’ section.",

  /**
   * Student ID: explains when and how students receive their AUC ID and its
   * importance for accessing campus facilities.
   */
  "student-id":
    "Your AUC student ID card is issued during orientation once IPSO confirms your course registration. The ID card grants access to campus buildings, housing, library and other services, so carry it at all times. If you live on campus, you must activate your ID to open residence halls and you may request a spare key card for a refundable deposit【656789696840349†L155-L161】. If your card is lost or damaged, contact the Student ID office for a replacement (a fee applies). Never share your ID card with others and do not send photos of it via this chatbot.",

  /**
   * Email: describes how to activate your AUC email and why it is important.
   */
  "email":
    "After securing admission, you will receive instructions to create and activate your official AUC email account (username@aucegypt.edu). This account is required to access the StarRez housing portal and to receive official communications. Check your AUC email regularly for announcements about course registration, orientation, visa procedures, housing and university events. Do not share your email password via this bot; contact the IT Help Desk at +20 2 2615 1200 if you have trouble accessing your account.",

  /**
   * Emergency: lists campus and public emergency numbers and emphasises that
   * serious issues must be directed to security or medical services.
   */
  "emergency":
    "For urgent assistance on campus, call AUC Security at +20 2 2615 4444; the medical clinic in New Cairo at +20 2 2615 4000; or the medical clinic at Tahrir Square at +20 2 2797 5000【589841503635804†L169-L189】. The university doctor can be reached at 0128 000 1039 and the Facilities & Operations service center at +20 2 2615 2222. For environmental health and safety issues call +20 2 2615 4170/4180, and for IT emergencies call the Help Desk at +20 2 2615 1200【589841503635804†L169-L189】. The campus emergency hotline is 19282 (19AUC). Public emergency numbers in Egypt include ambulance (123), civil defense (125), police (122), road emergencies (012 2111 0000) and tourism police (126)【589841503635804†L169-L189】. If you ever feel unsafe, contact these numbers immediately and follow instructions from campus security. This chatbot cannot handle emergencies.",

  /**
   * Contact: provides IPSO location, office hours and contact details as well
   * as other useful email addresses. Always refer to official offices for
   * personalised advice.
   */
  "contact":
    "The International Programs and Services Office (IPSO) is located in Room P126 of the Prince Alwaleed Bin Talal Bin Abdulaziz Alsaud building on the AUC campus. Office hours are 9:00 AM to 3:00 PM【845159595531818†L206-L219】. You can email ipso@aucegypt.edu or call +20 2 2615 3612 for assistance with arrival, visa/residency, housing, registration and other concerns【845159595531818†L206-L219】. For visa questions contact the Business Support Office at students.residency@aucegypt.edu. For airport transportation queries email carpool@aucegypt.edu【130122837438368†L162-L170】. Remember that this chatbot provides general guidance only; always contact IPSO or the relevant AUC office for official assistance."
};

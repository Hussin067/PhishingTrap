"""
Awareness-training content for each approved phishing scenario.

The agent recommends a topic (a scenario identifier); the backend turns it into
a regular Training row plus TrainingQuestion rows, so the existing
/trainings/{id}/questions and /trainings/{id}/submit endpoints work unchanged.
No new training tables are needed.
"""

TRAINING_CATALOG = {
    "password_reset": {
        "title": "Spotting fake password reset emails",
        "content": (
            "Attackers send urgent 'reset your password' emails to steal credentials. "
            "Never use the link in an unexpected reset email. Open the official site "
            "yourself, check the sender address, and report anything you did not request."
        ),
        "questions": [
            ("You get a password reset email you did not request. What is the safest first step?",
             ["Click the link and reset", "Go to the official site yourself", "Reply asking if it is real", "Forward it to a friend"], "B",
             "Go to the site by typing the address or using a bookmark, never via the email link."),
            ("Which detail most suggests a fake reset email?",
             ["Urgent threat to lock your account", "It addresses you by name", "It has the company logo", "It arrives on a weekday"], "A",
             "Urgency and threats are classic pressure tactics; names and logos are easy to copy."),
        ],
    },
    "account_verification": {
        "title": "Account verification scams",
        "content": (
            "Fake 'verify your account' messages try to collect your login details. "
            "Legitimate services rarely demand verification through an emailed link."
        ),
        "questions": [
            ("An email says your account will be closed unless you verify now. What should you do?",
             ["Verify immediately", "Ignore the deadline and check via the official site", "Send your password to support", "Click and look around"], "B",
             "Verify through the official site, not the email, and report the message."),
            ("Why do attackers add a short deadline?",
             ["To help you", "To make you act without thinking", "Because of a system limit", "To save bandwidth"], "B",
             "Time pressure reduces careful checking."),
        ],
    },
    "invoice": {
        "title": "Fake invoice emails",
        "content": (
            "Fraudulent invoices push you to open attachments or links to 'review' a payment. "
            "Check that you expected the invoice and confirm it with the sender through a known channel."
        ),
        "questions": [
            ("You receive an unexpected invoice with a link. What is best?",
             ["Open it to see what it is", "Confirm with the vendor using known contact details", "Pay to be safe", "Forward to all colleagues"], "B",
             "Use contact details you already have, not those in the email."),
            ("Which is a red flag on an invoice email?",
             ["Unknown vendor and urgent payment demand", "A reference number", "A polite greeting", "A PDF attachment name"], "A",
             "Unknown senders demanding quick payment are suspicious."),
        ],
    },
    "security_alert": {
        "title": "Fake security alerts",
        "content": (
            "Attackers imitate security teams with 'suspicious sign-in' alerts to get you to click. "
            "Real alerts can be checked by signing in directly or asking the IT security team."
        ),
        "questions": [
            ("An alert says there was a suspicious sign-in and asks you to click to secure your account. What now?",
             ["Click right away", "Check your account by going to the official site, and report the email", "Reply with your password", "Ignore all future alerts"], "B",
             "Go to the service directly and report the message."),
            ("Why are fake security alerts effective?",
             ["They exploit fear of losing access", "They are always well written", "They come from IT every day", "They contain no links"], "A",
             "Fear prompts quick, careless clicks."),
        ],
    },
    "payment_request": {
        "title": "Fraudulent payment requests",
        "content": (
            "Payment-request scams impersonate managers or vendors and ask for fast transfers. "
            "Always verify payment requests through a second, trusted channel."
        ),
        "questions": [
            ("A message from a 'manager' asks for an urgent payment. What do you do?",
             ["Pay quickly", "Verify by phone or in person using known details", "Ask for a bigger amount", "Reply with bank details"], "B",
             "A second channel breaks the attacker's control of the conversation."),
            ("Which request should always be double-checked?",
             ["Meeting invitations", "Changes to bank details or urgent transfers", "Newsletters", "Calendar updates"], "B",
             "Money movement requests are the most valuable to attackers."),
        ],
    },
    "shipping_notification": {
        "title": "Fake shipping notifications",
        "content": (
            "Parcel notices with tracking links are common lures. If you are not expecting a "
            "delivery, do not click; use the carrier's official site or app."
        ),
        "questions": [
            ("You get a 'delivery failed' email but expect no parcel. What do you do?",
             ["Click to reschedule", "Do not click; check the carrier's official site if needed", "Enter card details", "Forward it"], "B",
             "Unexpected delivery notices are a common lure."),
            ("What is the safest way to track a real parcel?",
             ["Use the link in any email", "Use the retailer's or carrier's official site or app", "Call numbers in the email", "Ask a coworker"], "B",
             "Use sources you reach yourself."),
        ],
    },
    "order_confirmation": {
        "title": "Fake order confirmations",
        "content": (
            "A confirmation for something you did not buy is designed to make you click 'cancel' "
            "or 'view order'. Check your real account instead."
        ),
        "questions": [
            ("An order confirmation arrives for an item you never bought. What now?",
             ["Click cancel order", "Check your real account and report the email", "Reply with your address", "Call the number in the email"], "B",
             "The 'cancel' link is the trap."),
            ("Which hint suggests a fake order email?",
             ["Generic greeting and unexpected purchase", "Matching branding", "Correct date", "Short subject"], "A",
             "Surprise purchases and generic wording are warning signs."),
        ],
    },
    "mfa_verification": {
        "title": "MFA and verification-code scams",
        "content": (
            "Attackers ask you to approve an MFA prompt or share a code. Never approve a prompt "
            "you did not start and never share verification codes."
        ),
        "questions": [
            ("You receive an MFA prompt you did not trigger. What should you do?",
             ["Approve it to stop the prompts", "Deny it and report to IT security", "Share the code with the caller", "Ignore it completely"], "B",
             "Unrequested prompts mean someone has your password; deny and report."),
            ("Who should you give your one-time verification code to?",
             ["IT support on request", "A caller who knows your name", "Nobody", "Your manager"], "C",
             "Legitimate staff never need your one-time code."),
        ],
    },
    "document_shared": {
        "title": "Fake shared-document links",
        "content": (
            "Fake 'a document was shared with you' emails lead to credential-stealing pages. "
            "Confirm with the sender, or open the document from your own file-sharing account."
        ),
        "questions": [
            ("You get a shared-document link from someone you do not expect. Best action?",
             ["Click and sign in", "Check with the sender via another channel before opening", "Forward it", "Download the file"], "B",
             "Confirm through a different channel first."),
            ("What does a login page after clicking a shared link suggest?",
             ["Normal behaviour", "A possible credential-stealing page", "A fast connection", "A system update"], "B",
             "A sign-in request after an email link is a red flag."),
        ],
    },
    "payroll_update": {
        "title": "Payroll update scams",
        "content": (
            "Messages about salary or bank-detail changes target personal data. HR and payroll "
            "changes are made through internal systems, not emailed forms."
        ),
        "questions": [
            ("An email asks you to confirm payroll details via a link. What is best?",
             ["Confirm quickly", "Contact HR/payroll through internal channels", "Reply with your bank details", "Ignore everything about pay"], "B",
             "Verify internally before sharing personal or bank data."),
            ("Why are payroll lures effective?",
             ["They involve your money and personal data", "They are rare", "They come from IT", "They never contain links"], "A",
             "Money and personal data motivate quick action."),
        ],
    },
    "hr_document": {
        "title": "Fake HR document requests",
        "content": (
            "Attackers pose as HR with policy or contract documents to review or sign. Check "
            "with HR through internal channels before opening unexpected documents."
        ),
        "questions": [
            ("An email from 'HR' asks you to review and sign a document via a link. What do you do?",
             ["Sign immediately", "Confirm with HR through a known internal channel", "Forward to friends", "Open it on a personal device"], "B",
             "Verify with HR using contact details you already trust."),
            ("Which is a warning sign in an HR email?",
             ["Pressure to act today and an unfamiliar link", "A formal tone", "A company name", "A subject line"], "A",
             "Pressure and unfamiliar links are the main signs."),
        ],
    },
    "benefits_update": {
        "title": "Fake benefits update emails",
        "content": (
            "Benefits-enrolment lures ask you to log in to 'update your benefits'. Use the "
            "official benefits portal address you already know."
        ),
        "questions": [
            ("An email says you must update your benefits today via a link. What now?",
             ["Click the link", "Open the official benefits portal yourself or ask HR", "Reply with your ID number", "Ignore HR for good"], "B",
             "Use the portal address you already know."),
            ("What should you never send in response to such an email?",
             ["A question to HR via internal chat", "Personal identification or login details", "A report to IT security", "A thank-you"], "B",
             "Never send identity or login details by email."),
        ],
    },
}

DIFFICULTY_TO_TRAINING_LEVEL = {
    "easy": "beginner",
    "medium": "intermediate",
    "hard": "advanced",
}

PHISHING_TEMPLATES = {

    "password_reset": {
        "subject": "Your password needs to be reset",
        "body": """
Hello {employee_name},

We detected unusual activity on your account.

Please verify your account and reset your password using the link below:

{phishing_link}

Thank you,
IT Security Team
"""
    },

    "account_verification": {
        "subject": "Action required: Verify your account",
        "body": """
Hello {employee_name},

Your account requires verification to remain active.

Please verify your account using the link below:

{phishing_link}

Regards,
Security Team
"""
    },

    "invoice": {
        "subject": "Invoice requires your attention",
        "body": """
Hello {employee_name},

A new invoice has been assigned to your account.

Please review the invoice using the link below:

{phishing_link}

Regards,
Finance Department
"""
    },

    "security_alert": {
        "subject": "Security alert: Immediate verification required",
        "body": """
Hello {employee_name},

Our security system detected unusual activity associated with your account.

Please verify your account immediately:

{phishing_link}

Security Operations Team
"""
    },

    "payment_request": {
        "subject": "Payment request requires your attention",
        "body": """
Hello {employee_name},

A payment request requires your review.

Please review the payment details using the link below:

{phishing_link}

Regards,
Finance Department
"""
    },

    "shipping_notification": {
        "subject": "Your shipment requires confirmation",
        "body": """
Hello {employee_name},

Your recent shipment is awaiting confirmation.

Please review the shipment information using the link below:

{phishing_link}

Regards,
Shipping Department
"""
    },

    "order_confirmation": {
        "subject": "Order confirmation",
        "body": """
Hello {employee_name},

Your order has been processed and is ready for review.

Please review your order details using the link below:

{phishing_link}

Thank you,
Customer Support
"""
    },

    "mfa_verification": {
        "subject": "Multi-factor authentication verification required",
        "body": """
Hello {employee_name},

Your account requires additional security verification.

Please complete the verification process using the link below:

{phishing_link}

Regards,
IT Security Team
"""
    },

    "document_shared": {
        "subject": "A document has been shared with you",
        "body": """
Hello {employee_name},

A document has been shared with you and is available for review.

Please access the document using the link below:

{phishing_link}

Regards,
Document Management Team
"""
    },

    "payroll_update": {
        "subject": "Payroll information requires an update",
        "body": """
Hello {employee_name},

Your payroll information requires verification.

Please review your payroll information using the link below:

{phishing_link}

Regards,
Human Resources
"""
    },

    "hr_document": {
        "subject": "Important HR document requires your attention",
        "body": """
Hello {employee_name},

An important HR document has been assigned to you.

Please review the document using the link below:

{phishing_link}

Regards,
Human Resources
"""
    },

    "benefits_update": {
        "subject": "Employee benefits information update",
        "body": """
Hello {employee_name},

Your employee benefits information is available for review.

Please review the latest information using the link below:

{phishing_link}

Regards,
Human Resources
"""
    }
}
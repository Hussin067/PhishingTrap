from html import escape

from backend.app.templates.phishing_templates import PHISHING_TEMPLATES


def render_phishing_template(
    template_name: str,
    employee_name: str,
    phishing_link: str
):
    template = PHISHING_TEMPLATES.get(template_name)

    if template is None:
        return None

    subject = template["subject"]

    body = template["body"]

    body = body.replace(
        "{employee_name}",
        escape(employee_name)
    )

    body = body.replace(
        "{phishing_link}",
        "__PHISHING_LINK__"
    )

    safe_body = escape(body)

    safe_body = safe_body.replace(
        "\n",
        "<br>"
    )

    phishing_button = (
        f'<a href="{escape(phishing_link, quote=True)}" '
        'style="display:inline-block; '
        'padding:12px 20px; '
        'background-color:#2563eb; '
        'color:white; '
        'text-decoration:none; '
        'border-radius:6px; '
        'font-weight:bold;">'
        'Review Now'
        '</a>'
    )

    safe_body = safe_body.replace(
        "__PHISHING_LINK__",
        phishing_button
    )

    html_email = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{escape(subject)}</title>
</head>

<body style="
    margin:0;
    padding:30px;
    background-color:#f4f4f4;
    font-family:Arial, sans-serif;
">

    <div style="
        max-width:600px;
        margin:auto;
        background:white;
        border-radius:8px;
        overflow:hidden;
    ">

        <div style="
            background-color:#1e3a8a;
            padding:20px 30px;
            color:white;
        ">

            <div style="
                display:flex;
                align-items:center;
            ">

                <div style="
                    width:42px;
                    height:42px;
                    background-color:white;
                    color:#1e3a8a;
                    border-radius:6px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:20px;
                    font-weight:bold;
                    margin-right:12px;
                ">
                    A
                </div>

                <div>
                    <div style="
                        font-size:18px;
                        font-weight:bold;
                    ">
                        Acme Corporation
                    </div>

                    <div style="
                        font-size:13px;
                        opacity:0.9;
                    ">
                        IT Security
                    </div>
                </div>

            </div>

        </div>

        <div style="
            padding:30px;
        ">

            <h2 style="
                color:#333;
                margin-top:0;
            ">
                {escape(subject)}
            </h2>

            <div style="
                color:#444;
                font-size:15px;
                line-height:1.6;
            ">
                {safe_body}
            </div>

        </div>

        <div style="
            padding:15px 30px;
            background-color:#f8fafc;
            color:#777;
            font-size:12px;
        ">
            Acme Corporation Security Team
        </div>

    </div>

</body>
</html>
"""

    return {
        "template_name": template_name,
        "subject": subject,
        "body": body,
        "html_body": html_email
    }
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(sender_email, sender_password, recipient_email, subject, body):
    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = recipient_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())
            print("Email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")


if __name__ == "__main__":
    load_dotenv()
    sender_email = os.getenv("EMAIL")
    sender_password = os.getenv("PASS")
    recipient_name = ""
    recipient_email = ""
    # recipient_name = input("Name: ")
    # recipient_email = input("Mail: ")
    subject = "Welcome to Feat.ify - Try Our App Now!"
    body = f"""Howdy {recipient_name}!

We are pumped to have you on board at Feat.ify, the place where you can uncover all those sick features and collaborations your favorite artists have been rocking! 🎶🔥

Get ready to unleash the music maestro within you! Welcome to the Feat.ify family!

Cheers,
The Feat.ify Team"""

    send_email(sender_email, sender_password, recipient_email, subject, body)

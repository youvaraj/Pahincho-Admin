export function followUpEmailGreetingName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  if (first) return first;
  const last = lastName.trim();
  return last || "there";
}

export function buildFollowUpEmailBody(firstName: string, lastName: string): string {
  const name = followUpEmailGreetingName(firstName, lastName);
  return `Hi ${name},

I'm Youva, the founder of Pahincho.

First, thank you for being one of our very first members! We're just getting started, and I truly appreciate you giving Pahincho a try.

I'm working to make Pahincho a useful place where neighbors can give away, lend, and borrow items locally.

I'd love to hear a little about your experience:

1. Were you able to find or get the item you were looking for?
2. Is there anything you're currently looking for or would like to borrow from someone nearby?
3. Do you have any items at home you'd consider giving away or lending to a neighbor?
4. Was anything confusing or difficult while using Pahincho?

Even a quick reply to one or two questions would mean a lot. Your feedback will help shape Pahincho as we grow.

Thank you again for being part of the beginning!

Best regards,
Youva
Founder, Pahincho
pahincho.com`;
}

export const FOLLOW_UP_EMAIL_SUBJECT = "Checking in from Pahincho";

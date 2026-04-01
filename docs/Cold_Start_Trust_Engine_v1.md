Cold-Start Trust Engine v1

Purpose
Assess unknown merchants before harm.

Output
Trusted / Caution / High Risk / Insufficient Data

Principle
Low evidence triggers Caution or Insufficient Data unless Flash Scam triggers are present.
Protected payment is a parachute, not a character reference.

Inputs (signals)

1) Identity & contact
- Physical address present and consistent
- Phone/email present and usable
- ABN/ACN (if AU merchant) matches the business name

2) Policy clarity
- Returns policy present and specific (timeframes, conditions, process)
- Refund policy clear
- Shipping timelines realistic and consistent

3) Payment behaviour
- Protected payment (PayPal / credit card) increases confidence
- Off-platform payment pressure is a major warning
- Bank transfer only is a warning (context dependent)

4) Checkout risk
- Forced subscriptions / trial traps
- Pre-checked boxes
- Hidden shipping fees until late checkout

5) Website / footprint
- Domain very new (signal only)
- Template store language / copy-paste content
- Mismatched branding or legal entity names
- Fake scarcity / countdowns everywhere

Decision rules (v1)
- If Flash Scam Matrix triggers → High Risk immediately.
- Else if identity is weak AND policies are weak AND checkout risk present → Caution.
- Else if identity strong AND policies clear AND protected payment AND no checkout risk → Trusted or Caution depending on strength.
- If most things are unknown but no red flags → Insufficient Data.

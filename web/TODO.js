// TODO: Future improvements and bug fixes
// 
// BUG FIXES:
// - [DONE] Fix Woody Allen incorrectly showing as dead
//   Updated search logic: Google fame check (>20M results) → Wikipedia → NewsAPI death keywords
//   More accurate death verification with multiple sources
//
// DESIGN:
// - [DONE] Add orange background to web page
//   Updated App.css and index.css with orange (#FF8C00) background
//   Navy blue buttons, white title text for contrast
//
// FEATURES:
// - Add email/SMS notification system
//   Allow users to sign up for alerts when a specific person is reported dead
//   Features needed:
//     * Email/phone input form
//     * Backend database to store subscriptions (name + contact info)
//     * Periodic checker (cron job) to monitor for deaths
//     * Email service integration (SendGrid, Mailgun, etc.)
//     * SMS service integration (Twilio, etc.)
//     * Unsubscribe mechanism
//     * Privacy policy for storing contact information

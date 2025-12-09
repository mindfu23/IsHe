// TODO: Future improvements and bug fixes
// 
// BUG FIXES:
// - Fix Woody Allen incorrectly showing as dead
//   Need to review detection logic - may be false positive from news articles
//   Check Google/Wikipedia data accuracy for living people
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

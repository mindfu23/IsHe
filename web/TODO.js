// TODO: Future improvements and bug fixes
// 
// ============================================================================
// TEST CASES (verified working December 9, 2025)
// ============================================================================
// | Name           | Status | Detection Method                              |
// |----------------|--------|-----------------------------------------------|
// | Woody Allen    | ALIVE  | No death indicators in Wikipedia              |
// | Donald Trump   | ALIVE  | No death indicators in Wikipedia              |
// | Hulk Hogan     | DEAD   | Full date range (Aug 11, 1953 – Jul 24, 2025) |
// | Elvis Presley  | DEAD   | Full date range + past tense "was"            |
// ============================================================================
//
// BUG FIXES:
// - [DONE] Fix Woody Allen incorrectly showing as dead
//   Updated search logic: Google fame check (>20M results) → Wikipedia → NewsAPI death keywords
//   More accurate death verification with multiple sources
//   Added User-Agent header for Wikipedia API (required)
//   Improved date range pattern matching for "Month DD, YYYY – Month DD, YYYY"
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
//
// - [ ] Celebrity Death Monitor (Server-side scheduled function)
//   Create a Netlify scheduled function to check NewsAPI.org for celebrity deaths
//   
//   Requirements:
//     * Run every 24 hours (cron: "0 0 * * *")
//     * Query NewsAPI for death-related headlines:
//       - "[celebrity] has died"
//       - "[celebrity] dead at"
//       - "[celebrity] passes away"
//       - "[celebrity] dies at"
//     * Maintain a list of monitored celebrities (start with a default list)
//     * Track which deaths have already been notified (prevent duplicates)
//   
//   Notification system design:
//     * Primary notification: Send email to jim.beach@gmail.com when any celebrity death detected
//     * Future: Send notifications to users who signed up for that specific celebrity
//     * Future: Send notifications to users who signed up for general death alerts
//   
//   Database schema (for future user subscriptions):
//     subscriptions {
//       id: string
//       email: string
//       phone?: string (for SMS)
//       celebrity_name?: string (null = all celebrities)
//       notification_type: 'email' | 'sms' | 'both'
//       created_at: timestamp
//       verified: boolean
//     }
//     
//     notified_deaths {
//       id: string
//       celebrity_name: string
//       detected_at: timestamp
//       news_source: string
//       news_url: string
//       notifications_sent: number
//     }
//   
//   Implementation files needed:
//     * netlify/functions/death-monitor.js (scheduled function)
//     * netlify/functions/send-notification.js (email sender)
//     * services/notification-service.js (abstraction layer for future SMS/push)
//


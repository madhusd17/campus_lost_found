# 🎓 CampusFind AI &mdash; Campus Lost-and-Found Matcher

A responsive, intelligent web application designed for university and college campuses to report, search, and match lost and found items using an explainable multi-factor AI compatibility engine.

Built with **pure HTML5, CSS3, and JavaScript (Vanilla JS)** &mdash; no server setup, build tools, or complex installations required!

---

## 🌟 Key Features

1. **Campus Authentication Portal (`login.html`)**:
   - Asks for **College/University Name**, **User Name / Student ID**, and **Password**.
   - Includes a password show/hide toggle and a 1-click **"Autofill Demo Student"** button for quick testing.
   - Saves session in browser `localStorage` and shows user identity in the dashboard navigation bar.

2. **Report Lost & Found Items**:
   - Toggle between **"I Lost This Item"** and **"I Found This Item"**.
   - Fields: Item Title, Category, Primary Color, Campus Location, Date, Detailed Description, Contact Info, and optional Image URL.
   - **Dynamic "Other" Input**: Selecting "Other" dynamically displays a custom text input for custom categories, colors, or locations.

3. **Multi-Factor AI Compatibility Engine**:
   - Click **"AI Matches"** on any item to calculate a match score ($0\% \text{ to } 100\%$) against all opposite items.
   - Transparent scoring breakdown shows *why* items matched (e.g., category match, overlapping keywords, same campus building).

4. **Owner-Verified Dual-Reunite System**:
   - Only the person who lost the item can confirm the match.
   - Clicking **"This is My Item! (Reunite Both)"** marks **both** the lost item and the matched found item as **Reunited** at the same time.
   - Displays a link badge showing which item each was reunited with.

5. **Search & Real-Time Filtering**:
   - Split search bar with a separate icon box and clean text field.
   - Filter tabs: **All Items**, **Lost**, **Found**, and **Reunited**.
   - Dropdown filters for categories and campus locations.

6. **Local Persistence & Demo Records**:
   - All reports and statuses are stored in browser `localStorage`.
   - Comes pre-populated with realistic campus items (MacBook Air, Student ID, Gym Duffel, etc.) so you can test immediately.
   - A **"Reset Demo Data"** button in the footer lets you restore the starter state at any time.

---

## 📁 Project Structure

```
campus_lost/
├── server.py         # Python Flask REST API backend & SQLite database manager
├── campus_find.db    # SQLite database (auto-generated on startup)
├── index.html        # Main dashboard: navbar, search bar, filters, items grid, report & match modals
├── login.html        # Student login page with session verification
├── styles.css        # Responsive styling, color tokens, cards, modals & animations
├── app.js            # Core AI matching engine, backend sync & localStorage fallback
└── README.md         # Project documentation and guide
```

---

## 🧠 How the AI Matching Algorithm Works

When you click **"AI Matches"** on an item, the heuristic scoring engine evaluates all opposite items using a weighted formula:

$$\text{Match Score} = \text{Category}(30\%) + \text{Keywords}(30\%) + \text{Location}(15\%) + \text{Color}(15\%) + \text{Timeline}(10\%)$$

| Factor | Weight | Scoring Criteria |
| :--- | :---: | :--- |
| **Category Alignment** | **$30\text{ pts}$** | $+30\text{ pts}$ for exact category match; $+15\text{ pts}$ for related types. |
| **Keyword NLP Overlap** | **$30\text{ pts}$** | Tokenizes title and description, eliminates stop words (*"the", "a", "my"*), and awards points based on shared keywords (*"MacBook", "AirPods", "blue"*). |
| **Location Proximity** | **$15\text{ pts}$** | $+15\text{ pts}$ if lost and found in the same campus building; $+10\text{ pts}$ for adjacent campus zones. |
| **Color Match** | **$15\text{ pts}$** | $+15\text{ pts}$ for exact primary color match; $+10\text{ pts}$ if the color name is mentioned in the description. |
| **Timeline Plausibility** | **$10\text{ pts}$** | $+10\text{ pts}$ if found within $0\text{--}3$ days of being lost; $+7\text{ pts}$ within 2 weeks. |

### Match Badges:
* 🟢 **$75\% \text{ to } 100\%$**: High Probability Match
* 🟡 **$50\% \text{ to } 74\%$**: Possible Match
* ⚪ **$< 50\%$**: Low Probability

---

## 🚀 How to Run and Test

### Option A: With Python Flask & SQLite Backend (Recommended)
1. Open PowerShell / Command Prompt in the project folder:
   ```powershell
   python server.py
   ```
2. Open your browser to:
   ```
   http://127.0.0.1:5000
   ```
   *Any device on your local Wi-Fi network can also access it using your computer's local IP (e.g. `http://192.168.1.X:5000`)!*

### Option B: Standalone Frontend Mode (No Server Needed)
1. Open File Explorer to:
   ```
   c:\Users\dell\OneDrive\Documents\campus_lost
   ```
2. Double-click [`login.html`](login.html) to run directly in Google Chrome, Microsoft Edge, or Firefox.
   *Uses `localStorage` for offline persistence!*

### 2. Quick Testing Walkthrough
1. **Log In**: Click **"Autofill Demo Student"**, then click **"Enter Lost & Found Portal"**.
2. **Explore the Feed**: Notice the separated search bar, stats counters, and item cards.
3. **Run AI Matching**:
   - Locate the lost card: **"Midnight Blue Apple MacBook Air M2"**.
   - Click the purple **"AI Matches"** button.
   - Observe the score ($90\%+$) and the breakdown tags explaining why the laptop in the Library matches.
4. **Test Dual-Reunite**:
   - Click **"This is My Item! (Reunite Both)"**.
   - Notice that **both** the lost MacBook and the found laptop are now tagged as **Reunited** with linked badges.
5. **Report an Item**:
   - Click **"Report an Item"** in the navigation bar.
   - Try choosing **"Other"** in the Category, Color, or Location dropdown to type your custom details.
   - Click **"Submit Report"** to see your item added to the feed and stored in `localStorage`.
6. **Search & Filters**:
   - Type `"backpack"` or `"cafeteria"` in the search bar.
   - Switch between **Lost**, **Found**, and **Reunited** tabs.

---

## 🛠️ Technologies Used

* **HTML5**: Semantic elements, accessible form controls, and modal dialogs.
* **CSS3**: CSS Custom Properties (variables), Flexbox, CSS Grid, animations, and responsive media queries.
* **JavaScript (ES6+)**: Tokenization, text similarity computation, event delegation, and DOM manipulation.
* **Storage**: Web Storage API (`localStorage`) for zero-backend client-side persistence.
* **Icons & Fonts**: Font Awesome 6.4.0 and Google Fonts (*Inter*).

---

## 📄 License
This project is open-source and free to customize for any campus, hackathon, or university project.


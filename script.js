// **ध्यान दें:** यहाँ अपने Google Apps Script Web App URL को पेस्ट करें
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxaGotuSRWXtXzjBjiuLhvU069CQztQEw06YpT7E-vWoodS6pcdQ4-5JHzwVTcU0VEl1Q/exec"; 
const MAX_VISIBLE_ITEMS = 3; // शुरुआत में कार्ड में कितने आइटम दिखने चाहिए

// ----------------------
// News Fetching और Grouping Logic
// ----------------------

async function fetchNews() {
    const container = document.getElementById('news-container');
    container.innerHTML = '<p id="loading-message">खबरें लोड हो रही हैं...</p>';

    try {
        const response = await fetch(GAS_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rawData = await response.json();
        
        // 1. डेटा को तारीख (Date) के अनुसार Grouping करना
        const groupedNews = rawData.reduce((groups, item) => {
            // Apps Script से मिली Date Key (e.g., "2025-10-20")
            const date = item.date; 
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(item);
            return groups;
        }, {});

        // 2. तारीखों को क्रम में सॉर्ट करना (सबसे नई तारीख सबसे ऊपर)
        const sortedDates = Object.keys(groupedNews).sort().reverse(); 

        container.innerHTML = ''; // Loading message हटाएँ

        if (sortedDates.length === 0) {
            container.innerHTML = '<p>कोई खबर उपलब्ध नहीं है।</p>';
            return;
        }

        // 3. प्रत्येक तारीख के लिए कार्ड बनाना
        sortedDates.forEach(date => {
            const newsItems = groupedNews[date];
            const card = createDateCard(date, newsItems);
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching news:", error);
        container.innerHTML = `<p style="color: red;">डेटा फ़ेच करने में त्रुटि: ${error.message}</p>`;
    }
}


// ----------------------
// HTML Element Creation
// ----------------------

function createDateCard(date, newsItems) {
    const card = document.createElement('div');
    card.className = 'date-card';
    
    // Header (Date)
    const header = document.createElement('div');
    header.className = 'card-header';
    header.textContent = `दिनांक: ${date}`;
    card.appendChild(header);

    // News List
    const newsList = document.createElement('ul');
    newsList.className = 'news-list';
    
    // अगर आइटम MAX_VISIBLE_ITEMS से ज़्यादा हैं, तो List को collapse करें
    const needsCollapse = newsItems.length > MAX_VISIBLE_ITEMS;
    if (needsCollapse) {
        newsList.classList.add('collapsed');
    }

    newsItems.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'news-item';
        
        const linkElement = document.createElement('a');
        linkElement.href = item.link;
        linkElement.target = '_blank';
        linkElement.textContent = item.headline;
        
        listItem.appendChild(linkElement);
        newsList.appendChild(listItem);
    });
    
    card.appendChild(newsList);

    // Show More/Read More Button (अगर ज़रूरी हो)
    if (needsCollapse) {
        const button = document.createElement('button');
        button.className = 'show-more-button';
        button.textContent = `और ${newsItems.length - MAX_VISIBLE_ITEMS} खबरें देखें (Show More)`;
        
        // बटन पर क्लिक करने पर Expand/Collapse फ़ंक्शन
        button.addEventListener('click', () => toggleNewsList(newsList, button, newsItems.length - MAX_VISIBLE_ITEMS));
        
        card.appendChild(button);
    }

    return card;
}


// ----------------------
// Expand/Collapse Logic
// ----------------------

function toggleNewsList(listElement, buttonElement, hiddenCount) {
    listElement.classList.toggle('collapsed');
    
    if (listElement.classList.contains('collapsed')) {
        // Collapsed state
        buttonElement.textContent = `और ${hiddenCount} खबरें देखें (Show More)`;
    } else {
        // Expanded state
        buttonElement.textContent = 'कम करें (Show Less)';
    }
}


// ----------------------
// Initial Load and Auto-Refresh
// ----------------------

// Share बटन कार्यक्षमता (वही रहेगी)
document.getElementById('share-button').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            text: 'रोज़ाना ताज़ा खबरें यहाँ देखें!',
            url: window.location.href,
        }).catch(error => console.log('Sharing failed', error));
    } else {
        alert("इस ब्राउज़र में Share फ़ीचर उपलब्ध नहीं है। आप URL कॉपी कर सकते हैं।");
    }
});

// Mic बटन कार्यक्षमता (वही रहेगी)
document.getElementById('mic-button').addEventListener('click', () => {
    alert("Voice control फ़ीचर जल्द ही...");
});


// पेज लोड होने पर डेटा fetch करें और हर 5 मिनट में auto-refresh करें
fetchNews();
setInterval(fetchNews, 5 * 60 * 1000); 

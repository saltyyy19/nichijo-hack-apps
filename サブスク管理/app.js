// 状態管理
let subscriptions = [];
const STORAGE_KEY = 'subManager_data';

// --- 追加: カテゴリ状態管理 ---
const CAT_STORAGE_KEY = 'subManager_categories';
const defaultCategories = [
    { id: 'entertainment', name: 'エンタメ(動画/音楽)', icon: 'fa-film', bgColor: 'var(--cat-ent)' },
    { id: 'utility', name: '通信費/光熱費', icon: 'fa-bolt', bgColor: 'var(--cat-util)' },
    { id: 'software', name: 'ソフトウェア/ツール', icon: 'fa-laptop-code', bgColor: 'var(--cat-soft)' },
    { id: 'other', name: 'その他', icon: 'fa-box', bgColor: 'var(--cat-other)' }
];
let categories = [...defaultCategories];

// カテゴリ色を循環させるための定義
const catColors = ['var(--cat-ent)', 'var(--cat-util)', 'var(--cat-soft)', 'var(--cat-other)', '#ff9ff3', '#feca57', '#ff6b6b', '#48dbfb'];

// DOM要素の取得
const addBtn = document.getElementById('addBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeBtn = document.getElementById('closeBtn');
const subForm = document.getElementById('subForm');
const subList = document.getElementById('subList');
const emptyState = document.getElementById('emptyState');
const monthlyTotalEl = document.getElementById('monthlyTotal');
const yearlyTotalEl = document.getElementById('yearlyTotal');

// --- 追加: タブ用のDOM ---
const tabMonthly = document.getElementById('tabMonthly');
const tabYearly = document.getElementById('tabYearly');
const monthlyView = document.getElementById('monthlyView');
const yearlyView = document.getElementById('yearlyView');
const yearlyEstimateFromMonthly = document.getElementById('yearlyEstimateFromMonthly');
const monthlyEstimateFromYearly = document.getElementById('monthlyEstimateFromYearly');

let currentViewMode = 'monthly'; // 'monthly' or 'yearly'

// --- 追加: カテゴリ設定モーダル用のDOM ---
const settingsBtn = document.getElementById('settingsBtn');
const categoryModalOverlay = document.getElementById('categoryModalOverlay');
const categoryCloseBtn = document.getElementById('categoryCloseBtn');
const categoryAddForm = document.getElementById('categoryAddForm');
const settingsCategoryList = document.getElementById('settingsCategoryList');
const subCategorySelect = document.getElementById('subCategory');

// --- 追加: サブスク編集モーダル用のDOM ---
const editModalOverlay = document.getElementById('editModalOverlay');
const editCloseBtn = document.getElementById('editCloseBtn');
const editForm = document.getElementById('editForm');
const editSubCategorySelect = document.getElementById('editSubCategory');

// --- 追加: カスタムコンファーム（確認）ダイアログ用のDOM ---
const confirmModalOverlay = document.getElementById('confirmModalOverlay');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmOkBtn = document.getElementById('confirmOkBtn');

// 初期化
function init() {
    loadCategories();
    loadData();
    renderCategorySelect();
    renderList();
    updateDashboard();
}

// LocalStorageからデータ読み込み
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        subscriptions = JSON.parse(saved);
    }
}

// LocalStorageにデータ保存
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
}

// --- 追加: カテゴリデータの読み書き ---
function loadCategories() {
    const savedCats = localStorage.getItem(CAT_STORAGE_KEY);
    if (savedCats) {
        categories = JSON.parse(savedCats);
    } else {
        categories = [...defaultCategories];
    }
}

function saveCategories() {
    localStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(categories));
}

// サブスク追加モーダルの開閉
addBtn.addEventListener('click', () => {
    subForm.reset();

    const today = new Date();
    document.getElementById('subNextDate').value = today.toISOString().split('T')[0];

    modalOverlay.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

// カテゴリ設定モーダルの開閉
settingsBtn.addEventListener('click', () => {
    renderSettingsCategoryList();
    categoryModalOverlay.classList.add('active');
});

categoryCloseBtn.addEventListener('click', () => {
    categoryModalOverlay.classList.remove('active');
});

// --- 追加: 編集モーダルの開閉 ---
editCloseBtn.addEventListener('click', () => {
    editModalOverlay.classList.remove('active');
});

// --- 追加: タブ切り替え ---
tabMonthly.addEventListener('click', () => {
    currentViewMode = 'monthly';
    tabMonthly.classList.add('active');
    tabYearly.classList.remove('active');
    monthlyView.style.display = 'block';
    yearlyView.style.display = 'none';
    renderList(); // リストの表示内容も切り替え
});

tabYearly.addEventListener('click', () => {
    currentViewMode = 'yearly';
    tabYearly.classList.add('active');
    tabMonthly.classList.remove('active');
    yearlyView.style.display = 'block';
    monthlyView.style.display = 'none';
    renderList(); // リストの表示内容も切り替え
});

// モーダルの外側をクリックで閉じる
window.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    if (e.target === categoryModalOverlay) {
        categoryModalOverlay.classList.remove('active');
    }
    if (e.target === editModalOverlay) {
        editModalOverlay.classList.remove('active');
    }
});

// サブスクフォーム送信（サブスク追加）
subForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newSub = {
        id: Date.now().toString(),
        name: document.getElementById('subName').value,
        price: parseInt(document.getElementById('subPrice').value, 10),
        cycle: document.getElementById('subCycle').value,
        nextDate: document.getElementById('subNextDate').value,
        category: document.getElementById('subCategory').value
    };

    subscriptions.push(newSub);
    saveData();
    renderList();
    updateDashboard();

    modalOverlay.classList.remove('active');
});

// --- 追加: サブスク編集フォーム送信 ---
editForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const editId = document.getElementById('editSubId').value;
    const newName = document.getElementById('editSubName').value.trim();

    if (!newName) {
        alert("サービス名を入力してください。");
        return;
    }

    subscriptions = subscriptions.map(sub => {
        if (sub.id === editId) {
            return {
                ...sub,
                name: newName,
                price: parseInt(document.getElementById('editSubPrice').value, 10),
                cycle: document.getElementById('editSubCycle').value,
                nextDate: document.getElementById('editSubNextDate').value,
                category: document.getElementById('editSubCategory').value
            };
        }
        return sub;
    });

    saveData();
    renderList();
    updateDashboard();

    editModalOverlay.classList.remove('active');
});

// --- 追加: カテゴリ追加フォーム送信 ---
categoryAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newCategoryName');
    const newName = nameInput.value.trim();
    if (!newName) return;

    // IDはタイムスタンプで生成、ランダムな色を割り当て
    const randomColor = catColors[Math.floor(Math.random() * catColors.length)];
    const newCat = {
        id: 'cat_' + Date.now(),
        name: newName,
        icon: 'fa-tags', // デフォルトアイコン
        bgColor: randomColor
    };

    categories.push(newCat);
    saveCategories();

    // UIを更新
    nameInput.value = '';
    renderSettingsCategoryList();
    renderCategorySelect();
    renderList(); // リストのアイコン色等もリセット対策で再描画
});

// カテゴリ削除関数
function deleteCategory(catId) {
    // デフォルトカテゴリは消せないようにする（任意）
    if (defaultCategories.find(c => c.id === catId)) {
        alert("デフォルトのカテゴリは削除できません。");
        return;
    }

    if (confirm("このカテゴリを削除しますか？\n(既にこのカテゴリを使っているサブスクは「その他」に変更されます)")) {
        // 対象のカテゴリを使っているサブスクを「other」に変更
        subscriptions = subscriptions.map(sub => {
            if (sub.category === catId) {
                return { ...sub, category: 'other' };
            }
            return sub;
        });
        saveData();

        categories = categories.filter(c => c.id !== catId);
        saveCategories();

        renderSettingsCategoryList();
        renderCategorySelect();
        renderList();
        updateDashboard();
    }
}

// サブスク追加・編集モーダル内のカテゴリ下拉菜单を生成
function renderCategorySelect() {
    subCategorySelect.innerHTML = '';
    editSubCategorySelect.innerHTML = ''; // 編集用も同時に更新

    categories.forEach(cat => {
        const option1 = document.createElement('option');
        option1.value = cat.id;
        option1.textContent = cat.name;
        subCategorySelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = cat.id;
        option2.textContent = cat.name;
        editSubCategorySelect.appendChild(option2);
    });
}

// カテゴリ設定モーダル内のリストを生成
function renderSettingsCategoryList() {
    settingsCategoryList.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-list-item';

        let delBtnHtml = '';
        // デフォルトカテゴリでなければ削除ボタンを表示
        if (!defaultCategories.find(c => c.id === cat.id)) {
            delBtnHtml = `<button type="button" class="del-cat-btn" onclick="deleteCategory('${cat.id}')" title="削除"><i class="fas fa-trash"></i></button>`;
        } else {
            delBtnHtml = `<span style="color:var(--text-secondary);font-size:0.8rem;">標準</span>`;
        }

        li.innerHTML = `
            <span><i class="fas ${cat.icon}" style="color:${cat.bgColor}; margin-right:8px;"></i> ${cat.name}</span>
            ${delBtnHtml}
        `;
        settingsCategoryList.appendChild(li);
    });
}

// ダッシュボード（金額合計）の更新
function updateDashboard() {
    let monthlySum = 0;
    let yearlySum = 0;

    subscriptions.forEach(sub => {
        if (sub.cycle === 'monthly') {
            monthlySum += sub.price;
            yearlySum += (sub.price * 12);
        } else if (sub.cycle === 'yearly') {
            monthlySum += Math.round(sub.price / 12);
            yearlySum += sub.price;
        }
    });

    // 各ビューの合計値に反映
    monthlyTotalEl.textContent = monthlySum.toLocaleString();
    yearlyTotalEl.textContent = yearlySum.toLocaleString();

    yearlyEstimateFromMonthly.textContent = '¥' + yearlySum.toLocaleString();
    monthlyEstimateFromYearly.textContent = '¥' + monthlySum.toLocaleString();
}

// 日数計算ヘルパー関数
function calculateDaysUntil(dateString) {
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0); // 時間をリセットして純粋な日付比較にする

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

// 日付のフォーマット（YYYY/MM/DD）
function formatDate(dateString) {
    const d = new Date(dateString);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

// カスタムコンファーム関数（非同期でPromiseを返す）
function customConfirm(title, message) {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.innerHTML = message.replace(/\n/g, '<br>');
        confirmModalOverlay.classList.add('active');

        // イベントリスナーを1回だけ発火するように設定
        const onOk = () => {
            cleanup();
            resolve(true);
        };
        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmModalOverlay.classList.remove('active');
            confirmOkBtn.removeEventListener('click', onOk);
            confirmCancelBtn.removeEventListener('click', onCancel);
        };

        confirmOkBtn.addEventListener('click', onOk);
        confirmCancelBtn.addEventListener('click', onCancel);
    });
}

// --- 追加: サブスクを編集領域にロードして開く ---
function editSub(id) {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;

    document.getElementById('editSubId').value = sub.id;
    document.getElementById('editSubName').value = sub.name;
    document.getElementById('editSubPrice').value = sub.price;
    document.getElementById('editSubCycle').value = sub.cycle;
    document.getElementById('editSubNextDate').value = sub.nextDate;
    document.getElementById('editSubCategory').value = sub.category;

    editModalOverlay.classList.add('active');
}

// --- 追加: サブスクを支払済（次回更新）にする ---
async function completeSub(id) {
    const sub = subscriptions.find(s => s.id === id);
    if (!sub) return;

    // 誤タップ防止用コンファーム
    const isConfirmed = await customConfirm(
        '支払完了の確認',
        `「${sub.name}」の支払いを完了し、\n次回の支払日に更新しますか？`
    );

    if (!isConfirmed) return;

    // 次回支払日の計算（月末ズレを考慮した安全な計算）
    const currentDate = new Date(sub.nextDate);
    const targetDay = currentDate.getDate();

    if (sub.cycle === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
        // 月をまたぐ計算で月末（31日など）がズレて翌月に食い込むバグの回避
        if (currentDate.getDate() !== targetDay) {
            currentDate.setDate(0); // その月の最終日にセット
        }
    } else if (sub.cycle === 'yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        // うるう年（2/29）から翌年への考慮
        if (currentDate.getDate() !== targetDay) {
            currentDate.setDate(0);
        }
    }

    const nextDateStr = currentDate.toISOString().split('T')[0];

    subscriptions = subscriptions.map(s => {
        if (s.id === id) {
            return { ...s, nextDate: nextDateStr };
        }
        return s;
    });

    saveData();
    renderList();
    updateDashboard();
}

// サブスクを削除
async function deleteSub(id) {
    const isConfirmed = await customConfirm('削除の確認', 'このサブスクリプションを削除してもよろしいですか？');
    if (isConfirmed) {
        subscriptions = subscriptions.filter(sub => sub.id !== id);
        saveData();
        renderList();
        updateDashboard();
    }
}

// HTMLタグのエスケープ関数（XSS対策）
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// リストの描画
function renderList() {
    // リストの中身（sub-item）のみをクリアし、emptyState要素は残す
    const items = subList.querySelectorAll('.sub-item');
    items.forEach(item => item.remove());

    if (subscriptions.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    // 支払日が近い順にソートし、現在の表示モード（月・年）に該当するものだけフィルタリング
    let targetSubs = [...subscriptions].sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
    targetSubs = targetSubs.filter(sub => sub.cycle === currentViewMode);

    if (targetSubs.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    targetSubs.forEach(sub => {
        // IDからカテゴリ情報を取得（見つからなければ「その他」を適用）
        const catInfo = categories.find(c => c.id === sub.category) || defaultCategories.find(c => c.id === 'other');

        const style = { bgColor: catInfo.bgColor, icon: catInfo.icon };
        const daysUntil = calculateDaysUntil(sub.nextDate);

        let daysText = '';
        let isWarning = false;

        if (daysUntil < 0) {
            daysText = '支払日を過ぎています';
            isWarning = true;
        } else if (daysUntil === 0) {
            daysText = '今日が支払日です！';
            isWarning = true;
        } else if (daysUntil <= 3) {
            daysText = `あと ${daysUntil} 日`;
            isWarning = true;
        } else {
            daysText = `あと ${daysUntil} 日`;
        }

        const li = document.createElement('div');
        li.className = `sub-item ${isWarning ? 'warning-card' : ''}`;

        const cycleText = sub.cycle === 'monthly' ? '/月' : '/年';
        const safeName = escapeHTML(sub.name);

        li.innerHTML = `
            <div class="sub-info">
                <div class="sub-icon" style="background-color: ${style.bgColor};">
                    <i class="fas ${style.icon}"></i>
                </div>
                <div class="sub-details">
                    <h3>${safeName}</h3>
                    <p>${formatDate(sub.nextDate)} 更新</p>
                </div>
            </div>
            <div class="sub-meta">
                <div class="sub-price">¥${sub.price.toLocaleString()}<span style="font-size:0.8rem; font-weight:normal;">${cycleText}</span></div>
                <div class="sub-next-date ${isWarning ? 'warning-text' : ''}">${daysText}</div>
                <div class="sub-actions">
                    <button class="action-btn" onclick="editSub('${sub.id}')" title="編集"><i class="fas fa-pen"></i></button>
                    ${isWarning ? `<button class="action-btn complete" onclick="completeSub('${sub.id}')" title="支払済にして更新"><i class="fas fa-check"></i> 支払済</button>` : ''}
                    <button class="action-btn del" onclick="deleteSub('${sub.id}')" title="削除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        subList.appendChild(li);
    });
}

// アプリ起動
init();

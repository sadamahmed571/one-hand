// ========================
// مخزن البيانات المشترك (localStorage)
// يستخدم في index.html و admin.html
// ========================
const DB_KEY = 'yad_wahda_admin';
let data = loadData();

function loadData() {
    try {
        const raw = JSON.parse(localStorage.getItem(DB_KEY));
        if (!raw) return getDefaults();

        // ترحيل البيانات القديمة إذا لزم الأمر
        if (raw.shares && !raw.donations) {
            raw.donations = raw.shares.map(s => ({
                id: s.id,
                donor: s.donor,
                phone: s.phone || '',
                date: s.date,
                items: [{
                    qty: s.qty,
                    status: s.status || 'completed',
                    isGift: s.isGift || false,
                    ...(s.isGift ? {
                        recipient: s.recipient || '',
                        giftType: s.giftType || 'myself',
                        recipientPhone: s.recipientPhone || '',
                        hideName: s.hideName || false
                    } : {})
                }]
            }));
            delete raw.shares;
            localStorage.setItem(DB_KEY, JSON.stringify(raw));
        }

        if (!raw.donations) raw.donations = getDefaults().donations;
        if (!raw.ticker) raw.ticker = getDefaults().ticker;
        if (!raw.wallets) raw.wallets = getDefaults().wallets;
        if (!raw.stats) raw.stats = getDefaults().stats;
        if (!raw.settings) raw.settings = getDefaults().settings;

        if (raw.settings.manualDonations === undefined) raw.settings.manualDonations = 0;
        if (raw.settings.manualShares === undefined) raw.settings.manualShares = 0;

        return raw;
    } catch (e) {
        return getDefaults();
    }
}

function getDefaults() {
    return {
        donations: [
            { id: 1, donor: 'أحمد محمد', phone: '967712345678', date: '2026-05-15', items: [{ qty: 5, status: 'completed', isGift: false }] },
            { id: 2, donor: 'فاطمة علي', phone: '967712345679', date: '2026-05-16', items: [{ qty: 3, status: 'completed', isGift: false }] },
            { id: 3, donor: 'خالد عمر', phone: '967712345680', date: '2026-05-17', items: [{ qty: 7, status: 'completed', isGift: false }, { qty: 3, status: 'completed', isGift: true, giftType: 'parents', recipient: 'والديّ', recipientPhone: '', hideName: false }] },
        ],
        ticker: [
            { id: 1, message: '🌙 تمت كفالة سهمين قبل قليل.. كتب الله أجركم', icon: 'moon', sort: 0, active: true },
            { id: 2, message: '🐑 متبقي 288 سهم على اكتمال الهدف', icon: 'star', sort: 1, active: true },
            { id: 3, message: '✨ شكراً لكافل 10 أسهم - بارك الله فيك', icon: 'star', sort: 2, active: true },
        ],
        wallets: [
            { id: 1, name: 'كريمي - أم فلوس', account: '3170928457', sort: 0 },
            { id: 2, name: 'محفظة جيب - Jaib', account: '774261416', sort: 1 },
            { id: 3, name: 'محفظة فلوسك - Floosak', account: '774261416', sort: 2 },
        ],
        stats: { orphans: 142, families: 89, governorates: 4, meatKg: 712 },
        settings: {
            targetShares: 1000,
            sharePrice: 1000,
            eidDate: '2026-06-26',
            whatsapp: '967775064424',
            siteUrl: 'https://yad-wahda.org/donate',
            manualDonations: 0,
            manualShares: 0
        }
    };
}

function saveData() {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
}

function refreshData() {
    const fresh = loadData();
    Object.assign(data, fresh);
}

function calcTotalShares() {
    const actual = data.donations.reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.qty, 0), 0);
    return actual + (parseInt(data.settings.manualShares, 10) || 0);
}

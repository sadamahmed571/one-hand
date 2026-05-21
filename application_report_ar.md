# تقرير تقييم وتطوير تطبيق "مبادرة يد واحدة"

## 1. تحليل التطبيق الحالي
يعتمد تطبيق "مبادرة يد واحدة" حالياً على بنية برمجية تعتمد على الواجهة الأمامية بشكل كامل (Frontend-only) مع استخدام التخزين المحلي للمتصفح (localStorage) لإدارة البيانات.

### المكونات الرئيسية:
*   **index.html:** الواجهة العامة للمستخدمين، تعرض إحصائيات الحملة، شريط الأخبار، خريطة التبرعات الحية، ونماذج التبرع والإهداء.
*   **admin.html:** لوحة تحكم إدارية تتيح إدارة التبرعات، تعديل الإعدادات، وإدارة شريط الأخبار والمحافظ.
*   **data.js:** الطبقة المسؤولة عن معالجة البيانات، حيث تقوم بتحميل وحفظ البيانات في `localStorage` وحساب الإجمالي.

### نقاط القوة:
*   واجهة مستخدم جذابة ومتجاوبة مع الهواتف المحمولة.
*   تجربة مستخدم تفاعلية (عدادات، تأثيرات حركية، نظام شهادات رقمية).
*   سهولة الإعداد والتشغيل كونه لا يتطلب خادماً خلفياً معقداً.

### نقاط الضعف والمخاطر:
*   **الاعتماد على localStorage:** البيانات مخزنة فقط في متصفح الشخص الذي أدخلها، مما يعني عدم مزامنة البيانات بين المستخدمين والمسؤولين بشكل لحظي وحقيقي.
*   **الأمان:** كلمة مرور لوحة التحكم مخزنة برمجياً في كود JavaScript (Hardcoded)، وهي عرضة للاختراق بسهولة.
*   **فقدان البيانات:** في حال قام المسؤول بمسح ذاكرة التصفح أو تغيير الجهاز، قد تُفقد جميع سجلات التبرعات ما لم يتم تصديرها يدوياً.

---

## 2. التوصيات الفنية والتطويرية

### أولاً: التحول إلى قاعدة بيانات سحابية (Supabase)
هذه هي الخطوة الأهم لضمان استمرارية وموثوقية التطبيق. سيوفر هذا:
1.  **مزامنة لحظية (Real-time):** ظهور التبرعات الجديدة فوراً لجميع الزوار.
2.  **مركزية البيانات:** تخزين جميع البيانات في مكان واحد آمن بدلاً من متصفحات الأفراد.
3.  **الأمان:** استخدام نظام المصادقة الخاص بـ Supabase بدلاً من كلمة المرور البسيطة.

### ثانياً: تحسينات الأمان
*   تفعيل نظام **Row Level Security (RLS)** في Supabase لضمان أن المسؤولين فقط هم من يمكنهم تعديل البيانات، بينما يقتصر دور المستخدمين على القراءة وإضافة طلبات التبرع.
*   تشفير البيانات الحساسة إن وجدت.

### ثالثاً: ميزات إضافية مقترحة
*   **نظام إشعارات تلقائي:** إرسال رسالة واتساب آلية للمتبرع عند تأكيد تبرعه من قبل المسؤول.
*   **لوحة إحصائيات متقدمة:** رسوم بيانية توضح معدل التبرع اليومي وتوزيعه الجغرافي.
*   **تطوير نظام الشهادات:** ربط الشهادات بروابط فريدة يمكن مشاركتها على وسائل التواصل الاجتماعي بشكل مباشر.

---

## 3. آلية الربط مع سوبا بيس (Supabase)

### أولاً: أكواد SQL لإنشاء الجداول
يجب تنفيذ هذه الأكواد في (SQL Editor) داخل لوحة تحكم Supabase:

```sql
-- جدول الإعدادات العامة
CREATE TABLE settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    target_shares INT DEFAULT 1000,
    share_price INT DEFAULT 1000,
    eid_date DATE,
    whatsapp TEXT,
    site_url TEXT,
    manual_donations INT DEFAULT 0,
    manual_shares INT DEFAULT 0,
    invite_template TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول التبرعات
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_name TEXT NOT NULL,
    phone TEXT,
    governorate TEXT,
    donation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول تفاصيل الأسهم (مرتبط بالتبرعات)
CREATE TABLE donation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID REFERENCES donations(id) ON DELETE CASCADE,
    qty INT DEFAULT 1,
    status TEXT DEFAULT 'pending', -- pending, completed
    is_gift BOOLEAN DEFAULT FALSE,
    recipient_name TEXT,
    gift_type TEXT,
    recipient_phone TEXT,
    hide_name BOOLEAN DEFAULT FALSE
);

-- جدول شريط الأخبار
CREATE TABLE ticker (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    icon TEXT DEFAULT 'star',
    active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- جدول محافظ الدفع
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    account TEXT NOT NULL,
    image_url TEXT,
    gradient TEXT,
    sort_order INT DEFAULT 0
);

-- جدول الدعوات
CREATE TABLE invitations (
    id SERIAL PRIMARY KEY,
    sender TEXT,
    recipient TEXT,
    invite_type TEXT, -- text, image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ثانياً: خطوات الربط البرمجي (JavaScript)

1.  **إضافة المكتبة في ملفات HTML:**
    ```html
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    ```

2.  **إعداد الاتصال (supabase-config.js):**
    ```javascript
    const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    ```

3.  **تحديث وظيفة جلب البيانات (مثال):**
    ```javascript
    async function loadDataFromSupabase() {
        const { data: donations, error } = await supabase
            .from('donations')
            .select('*, donation_items(*)');

        if (error) console.error('Error loading data:', error);
        return donations;
    }
    ```

4.  **تفعيل التحديث اللحظي (Real-time):**
    ```javascript
    supabase
        .channel('public:donations')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, payload => {
            console.log('تبرع جديد!', payload.new);
            // تحديث الواجهة تلقائياً
            refreshUI();
        })
        .subscribe();
    ```

---
**إعداد:** مهندس البرمجيات - جولز

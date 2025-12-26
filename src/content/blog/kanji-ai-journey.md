---
title: 'Hành trình xây dựng "Người thầy AI" hỗ trợ luyện viết chữ Kanji'
description: 'Chia sẻ từ góc nhìn của một sinh viên năm cuối về quá trình phát triển ứng dụng Web học Kanji với mô hình CNN đạt độ chính xác 99.14%'
pubDate: 'Dec 25 2025'
heroImage: '../../assets/kanji-ai-journey.png'
category: 'AI/ML'
---

Chào mọi người! Mình là một sinh viên năm cuối ngành Công nghệ phần mềm. Hôm nay mình muốn chia sẻ về hành trình xây dựng đồ án chuyên ngành của mình: **"Phát triển ứng dụng Web luyện viết Kanji kết hợp mô hình CNN"**. Đây không chỉ là một bài tập lớn cuối khóa, mà là nỗ lực của mình nhằm giải quyết một trong những bài toán hóc búa nhất khi học tiếng Nhật: **Chữ Kanji**.

## 🎯 Nguồn cảm hứng: Từ nỗi đau của người học tiếng Nhật

Bất kỳ ai đã từng học tiếng Nhật đều biết rằng việc ghi nhớ mặt chữ và nét viết của **hàng ngàn ký tự Kanji** là một thử thách thực sự. Mình từng thử nhiều ứng dụng học Kanji trên thị trường, nhưng hầu hết chỉ dừng lại ở việc tra cứu hoặc làm bài trắc nghiệm. **Thiếu đi sự tương tác thực tế** - nơi bạn thực sự cầm bút và viết.

Từ đó, ý tưởng ra đời: Tạo ra một môi trường nơi người học có thể **viết trực tiếp trên trình duyệt**, và ngay lập tức nhận được phản hồi từ một mô hình Trí tuệ nhân tạo có thể nhận diện và đánh giá nét viết của họ.

## 🧠 "Bộ não" của hệ thống: Mô hình CNN và con số 99.14%

### Dữ liệu là chìa khóa

Để AI có thể hiểu được chữ viết tay của nhiều người khác nhau, mình đã sử dụng bộ dữ liệu **ETL9G** - một trong những dataset lớn nhất về chữ viết tay tiếng Nhật với:

- **600,000+ ảnh** chữ viết tay thực tế
- **3,036 lớp ký tự** Kanji khác nhau
- Đa dạng phong cách viết từ nhiều người

Việc tiền xử lý ảnh về kích thước chuẩn 64×64 pixel và chuẩn hóa giá trị về khoảng [0, 1] là bước đệm quan trọng để mô hình học tập hiệu quả.

### Kiến trúc Residual - Điểm nhấn công nghệ

Thay vì dùng mạng CNN đơn giản, mình đã áp dụng **kiến trúc Residual Connection** (Kết nối tắt). Đây là kỹ thuật mà các mô hình state-of-the-art như ResNet sử dụng:

```
Input (64×64 grayscale)
    ↓
Conv2D (32 filters) → ReLU
    ↓
MaxPooling2D
    ↓
Conv2D (64 filters) → ReLU
    ↓
MaxPooling2D
    ↓
Conv2D (128 filters) → ReLU
    ↓
MaxPooling2D
    ↓
Flatten → Dense (512) → Dropout
    ↓
Output (3,036 classes - Softmax)
```

Kỹ thuật Residual Connection cho phép các lớp sâu hơn của mạng vẫn nhận được thông tin từ lớp trước mà không bị mất mát gradient, giúp mô hình **đạt độ chính xác ấn tượng 99.14%** trên tập validation.

## 🏗️ Kiến trúc hệ thống: Microservices đơn giản nhưng hiệu quả

Một trong những quyết định quan trọng nhất là thiết kế kiến trúc hệ thống. Mình đã chọn mô hình **Microservices giản lược** với 3 thành phần chính:

### 1. Frontend - Angular 21 với Signals

Nơi người dùng tương tác trực tiếp:

- **Canvas API** cho việc vẽ chữ
- **Angular Signals** để giao diện phản hồi tức thì
- Hỗ trợ cả chuột và touch (mobile-friendly)

```typescript
// Example: Sử dụng Signals để quản lý state
const prediction = signal<KanjiPrediction | null>(null);
const isDrawing = signal<boolean>(false);

// Real-time canvas drawing
canvasRef.nativeElement.addEventListener('mousemove', (e) => {
  if (isDrawing()) {
    drawOnCanvas(e.offsetX, e.offsetY);
  }
});
```

### 2. Backend - NestJS với Prisma ORM

"Nhà điều phối" trung tâm của hệ thống:

- Quản lý **authentication** với JWT
- CRUD operations cho User, Quiz, Flashcard
- Kết nối với **PostgreSQL** qua Prisma
- Giao tiếp với AI Service thông qua REST API

```typescript
// Example: Gọi AI Service để nhận diện Kanji
@Post('predict')
async predictKanji(@Body() imageData: string) {
  const response = await this.httpService.post(
    'http://ai-service:8000/api/v1/predict',
    { image: imageData }
  );
  return response.data;
}
```

### 3. AI Service - FastAPI + TensorFlow

Module độc lập xử lý AI:

- Load model TensorFlow (`kanji_3036_best_e4.h5`)
- Preprocessing ảnh từ Canvas
- Inference và trả về top-5 predictions
- Thời gian xử lý: **~100-200ms** mỗi prediction

```python
# Example: API endpoint cho prediction
@router.post("/predict")
async def predict_kanji(image_data: ImageRequest):
    # Preprocess image
    img = preprocess_image(image_data.image)
    
    # Model prediction
    predictions = model.predict(img)
    top_5 = get_top_k_predictions(predictions, k=5)
    
    return {"predictions": top_5}
```

## 🔄 Quá trình huấn luyện: Không có con đường nào trải đầy hoa hồng

### Những thách thức gặp phải

Quá trình train mô hình là một **thử thách về sự kiên nhẫn**:

**1. Overfitting ban đầu**
- Accuracy trên training set: 99.8%
- Accuracy trên validation set: 85%
- **Giải pháp:** Thêm Dropout layers và Data Augmentation

**2. Thời gian training lâu**
- 50 epochs × ~2000 batches = **100,000+ iterations**
- Thời gian: ~4-5 giờ trên GPU
- **Giải pháp:** Early stopping với patience=5

**3. Class imbalance**
- Một số Kanji phổ biến có nhiều samples hơn
- **Giải pháp:** Class weights và oversampling

### Chiến lược tối ưu

Để đạt được con số 99.14%, mình đã áp dụng nhiều kỹ thuật:

**Data Augmentation:**
```python
ImageDataGenerator(
    rotation_range=15,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    shear_range=0.1
)
```

**Learning Rate Scheduling:**
```python
ReduceLROnPlateau(
    monitor='val_loss',
    factor=0.5,
    patience=3,
    min_lr=1e-7
)
```

**Reproducibility:**
- Cố định random seed (1203) để đảm bảo kết quả nhất quán
- Sử dụng `tf.random.set_seed()` và `np.random.seed()`

## 📊 Kết quả thực tế

Sau nhiều tuần làm việc, đây là những con số mình đạt được:

| Metric | Value |
|--------|-------|
| **Training Accuracy** | 99.8% |
| **Validation Accuracy** | 99.14% |
| **Test Accuracy** | 98.7% |
| **Top-5 Accuracy** | 99.9% |
| **Average Inference Time** | 150ms |
| **Model Size** | 100MB |

**Ý nghĩa của các con số:**
- **99.14% validation accuracy** có nghĩa là trong 1000 lần viết chữ, chỉ có ~9 lần bị nhận diện sai
- **Top-5 accuracy 99.9%** có nghĩa là chữ đúng hầu như luôn nằm trong 5 dự đoán hàng đầu

## 💡 Tính năng nổi bật của ứng dụng

Ngoài tính năng nhận diện Kanji, ứng dụng còn có:

### 1. Quiz System
- Tạo bài quiz với nhiều dạng câu hỏi
- Kanji → Nghĩa, Nghĩa → Kanji, Onyomi, Kunyomi
- Auto-grading và detailed feedback

### 2. Flashcard với Spaced Repetition
- Học flashcard theo thuật toán SRS
- Tự động lên lịch ôn tập
- Progress tracking

### 3. News Reader với Furigana
- Đọc tin tức tiếng Nhật thực tế
- Tự động thêm Furigana (chú âm)
- Dịch từ trong context

### 4. Community Forum
- Chia sẻ kinh nghiệm học tập
- Hỏi đáp về Kanji
- Tạo study groups

## 🚧 Những hạn chế và hướng phát triển

Mình thừa nhận dự án vẫn còn nhiều điểm cần cải thiện:

**Hạn chế hiện tại:**
- ❌ Chỉ nhận diện được **ký tự đơn** (chưa hỗ trợ cụm từ)
- ❌ Cần **kết nối Internet** để xử lý (AI Service online)
- ❌ Chưa có **mobile app** native (chỉ có PWA)
- ❌ Model size khá lớn (100MB)

**Kế hoạch tương lai:**
- ✅ Tối ưu model bằng **TensorFlow Lite** (giảm xuống ~20MB)
- ✅ Triển khai **offline mode** với TF.js
- ✅ Phát triển **React Native app**
- ✅ Nhận diện **cụm chữ Kanji** (sequence prediction)
- ✅ Tích hợp **Text-to-Speech** cho News Reader
- ✅ Thêm **gamification** (badges, leaderboard)

## 🎓 Bài học kinh nghiệm

Sau khoảng 4 tháng làm việc với dự án này, mình có một số bài học muốn chia sẻ:

### 1. Data Quality > Data Quantity
Ban đầu mình nghĩ càng nhiều data càng tốt. Nhưng thực tế, **quality của data quan trọng hơn nhiều**. 100,000 ảnh chất lượng tốt tốt hơn 1 triệu ảnh nhiễu.

### 2. Start Simple, Then Optimize
Mô hình đầu tiên của mình rất phức tạp (10+ layers) nhưng accuracy chỉ ~92%. Sau khi đơn giản hóa và thêm Residual connections, accuracy nhảy lên 99%+.

### 3. Documentation is Key
Việc viết documentation chi tiết (như file `KANJI_WEB_PROJECT_DOCUMENTATION.md`) giúp mình rất nhiều khi quay lại review code sau vài tuần.

### 4. Testing Matters
E2E testing giúp mình phát hiện nhiều bug tiềm ẩn trước khi release. Đặc biệt với authentication flow và payment integration.

### 5. User Feedback is Gold
Beta testing với 20 bạn học tiếng Nhật giúp mình cải thiện UX đáng kể. Nhiều tính năng mình nghĩ hay nhưng user không dùng, và ngược lại.

## 🙏 Lời cảm ơn

Dự án này không thể thành công nếu không có:

- **Thầy cô hướng dẫn** - Support về mặt học thuật và định hướng nghiên cứu
- **Cộng đồng học tiếng Nhật** - Beta testers đầu tiên
- **Open source community** - TensorFlow, NestJS, Angular, Prisma
- **Gia đình và bạn bè** - Động viên tinh thần trong những lúc khó khăn

## 🎯 Kết luận

Xây dựng một ứng dụng AI-powered không hề đơn giản, nhưng nó cho mình **trải nghiệm thực tế vô giá**. Từ việc thiết kế database schema, xây dựng REST API, deploy microservices, đến huấn luyện deep learning model - tất cả đều là những kỹ năng quan trọng mà mình sẽ mang theo trong sự nghiệp sau này.

Nếu bạn cũng đang có ý tưởng về một dự án tương tự, **đừng ngần ngại bắt đầu**. Bạn sẽ gặp nhiều khó khăn, nhưng đó là cách tốt nhất để học hỏi và phát triển.

---

**Tech Stack Summary:**
- **Frontend:** Angular 21, TypeScript, Canvas API, Signals
- **Backend:** NestJS, Prisma ORM, PostgreSQL, JWT
- **AI:** Python, TensorFlow/Keras, FastAPI, OpenCV
- **DevOps:** Docker, Docker Compose, GitHub Actions

**GitHub:** [kanji-web-project](https://github.com/nhutphat1203/kanji-web)

**Live Demo:** *Coming soon...*

---

*Cảm ơn mọi người đã dành thời gian đọc bài viết của mình! Nếu có câu hỏi gì về technical details hoặc muốn trao đổi thêm, hãy để lại comment bên dưới nhé!* 💬

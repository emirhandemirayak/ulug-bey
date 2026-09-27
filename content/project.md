# TÜBİTAK projesi

## Proje başlığı

AKILLI RASATHANE: Uluğ Bey'in İzinde Yapay Zekâ Destekli Tarihî Model, Fiziksel/Dijital Rasathane Maketi ve Mobil Yıldız Haritası (TÜBİTAK 2204-A)

## Amaç

Projenin temel amacı, Uluğ Bey'in *Zîc-i Sultânî* adlı eserini ve Semerkand Rasathanesi mirasını, yapay zekâ, 3B fiziksel/dijital rasathane maketi ve mobil artırılmış gerçeklik (AR) uygulamalarıyla bütünleştirip güncel ve interaktif bir eğitim ekosistemine dönüştürmektir.

Alt amaçlar:

- Zîc-i Sultânî'deki 1018 yıldızın koordinat verilerini Python ve yapay zekâ regresyon algoritmalarıyla işleyip, Dünya'nın presesyon (açısal kayma, ~50.2″/yıl) hareketini simüle ederek güncel NASA/Gaia verileriyle karşılaştırmalı doğrulamak.
- Semerkand Rasathanesi'nin killi mimarisini ve Fakhri Sekstantı mekanizmasını 1/50 ölçekli fiziksel maket ve 3B parametrik dijital ikiz (Digital Twin) olarak üretip açısal optik testler yapmak.
- Hazırlanan yapay zekâ modelini ve 3B maket görsellerini "Akıllı Rasathane" mobil uygulaması üzerinden Artırılmış Gerçeklik (AR) deneyimine dönüştürmek.
- Fiziki maket, mobil uygulama ve atölye çalışmalarını okul içi etkinliklerle liseli öğrencilerin kullanımına sunarak astronomi ve bilim tarihine ilgiyi artırmak.

Bilim felsefesi açısından: gözlemsel astronominin "insan/el" odaklı geçmiş yöntemi ile günümüzün "yapay zekâ/algoritma" odaklı yöntemi arasındaki metodolojik değişimi ve sürekliliği ortaya koymak da hedeflerden biridir.

## Yöntem

Proje, fiziksel modelleme, yapay zekâ ve akademik ölçme-değerlendirmeyi bir arada yürüten 5 aşamadan oluşur:

1. **Ön test**: Örneklem öğrenci grubuna (60–80 öğrenci) "Bilim Felsefesi ve Kültürel Miras Algı Anketi" uygulanır; Türk-İslam bilim tarihi, bilimsel yöntem, rasyonellik ve yapay zekânın epistemolojik değeri hakkındaki ön bilgi/algı düzeyleri ölçülür.
2. **Fiziksel modelleme**: Semerkand Rasathanesi'nin 40 metrelik meridyen yayının (Fakhri Sekstantı) 1/50 ölçekli fiziksel maketi (mukavva/ahşap/3D yazıcı parçalarıyla) inşa edilir.
3. **Dijital dönüşüm**: (a) "Uluğ Bey Chatbotu" — doğal dil işleme ile öğrencilerin dönemin bilim felsefesi tartışmalarını ve astronomi hesaplarını birinci ağızdan deneyimlediği bir yapay zekâ asistanı; (b) Bilgisayarlı görü (Computer Vision) ile maketin bölümlerini tanıyıp açıklayan bir uygulama.
4. **Yaygın etki**: "Sanal Semerkant" YZ görsel sergisi, "30 Saniyelik Deha" kronometre yarışması, disiplinlerarası panel gibi okul içi etkinlikler.
5. **Son test ve veri analizi**: Aynı öğrenci grubuna ön testteki sorularla birebir aynı son test uygulanır; ön/son test farkları istatistiksel olarak karşılaştırılıp yüzdesel katkı raporlanır.

Yapay zekâ tarafı Python (Pandas, NumPy, Scikit-Learn) ile presesyon/zaman serisi analizini; mobil uygulama tarafı Flutter/AR Engine ile gökyüzü ve maket taramasını kapsar.

## Hipotezler

- **H1**: Zîc-i Sultânî'deki tarihsel yıldız koordinatları, yapay zekâ tabanlı presesyon düzeltmesi uygulandığında güncel NASA/Gaia verileriyle %99'un üzerinde korelasyon gösterecektir.
- **H2**: Akıllı Rasathane Modeli üzerindeki Fakhri Sekstant açısı, optik simülasyon ve YZ veri analitiğiyle test edildiğinde 15. yüzyıldaki ölçüm hassasiyetini nicel olarak kanıtlayacaktır.
- **H3**: Fiziksel model, mobil AR uygulaması ve okul sergileri bir arada kullanıldığında öğrencilerin bilim tarihi/astronomi kavramlarını öğrenme motivasyonu anlamlı derecede artacaktır.

## Beklenen / elde edilen sonuçlar

- YZ regresyon analizinde, Uluğ Bey'in koordinat ölçümlerindeki sapmanın modern NASA verilerine göre 0,02°–0,05° arasında kaldığı tespit edilmiştir.
- Fiziksel maket + AR uygulamasını birlikte kullanan öğrencilerde, astronomik ölçüm araçlarını ve bilim tarihini kavrama oranında %48'lik bir artış ölçülmüştür.
- Ön test/son test karşılaştırmasında, "Uluğ Bey'in dünya bilim tarihine katkılarını açıklayabilirim" maddesine "katılıyorum" oranının örnek uygulamada %18'den %86'ya yükseldiği raporlanmıştır.
- Disiplinlerarası (Felsefe–Tarih–Bilişim) bir eğitim materyali prototipi ortaya konmuş; üretilen 3B model ve AR kodlarının açık kaynak paylaşılması ve mobil uygulamanın MEB EBA platformuna entegre edilmesi önerilmiştir.

## Ekip

Proje, Antalya Neriman Erol Yılmaz Sosyal Bilimler Lisesi bünyesinde yürütülmüştür. Öğrenci/danışman isimleri bu dosyaya eklendiğinde burada listelenecektir.

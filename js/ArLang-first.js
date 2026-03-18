var langStr = "";
var langArr = ["th","vi","ja","ko","es","pt","en","km"];
var langPosition = ["th","vi","ja","ko","es","pt","en","km"];
var langMultiYn = "N";

var SUPPORTED_LANGS = ["th","vi","ja","ko","es","pt","en","km"];
var FALLBACK_PRIORITY = ["th","vi","ja","ko","es","pt","en","km"];



var lang = {
		"ko" : {
		    "AR_INDEX_TITLE" : "리워드 프로모션 - AR",
			"OPEN_IN_BROWSER": "브라우저에서 열기",
			"OPEN_IN_BROWSER2": "다시 브라우저에서 열기",
			"INAPP_INFO_TEXT": "현재 브라우저에서는 일부 기능이 제한됩니다.<br>다른 브라우저로 이동해 주세요.",
		    "INAPP_INFO_TITLE": "브라우저 환경 안내",
		    "LOADING_TEXT1" : "당신을 위한 특별한 경험을",
		    "LOADING_TEXT1_2" : "준비하고 있습니다.",
		    "LOADING_TEXT2" : "잠시만 기다려주세요.",
		    "LOADING_APP_BTN": "공식 앱으로 바로 시작하기",
		    "TRY_GAME_DIV1_TEXT1": "먼저 거리에서<br>토큰을 수집해보세요.",
		    "TRY_GAME_DIV1_TEXT2": "이번에는 식당에서<br>토큰을 수집해보세요.",
		    "TRY_GAME_INFO_MAIN_TITLE": "이제 카메라를 켜고<br>지금 당신의 주위에서, 새로운 AR 세상을 만나보세요.",
		    "TRY_GAME_INFO_SUB_TITLE": 'AR 체험을 위해 아래 권한을 허용해 주세요.<span style="font-weight:bold;">앱 설치·로그인 없이 바로 이용할 수 있어요.</span>',
		    "PERM_TITLE_NEW": "AR 세상을 열기 위한 준비",
		    "BROWSER_ERR1": "현재 브라우저는 호환성 문제가 있을 수 있습니다.",
		    "BROWSER_ERR2": "시작 시 ",
		    "BROWSER_ERR3": " 로 이동하여 실행됩니다.",
		    "EXP_INFO_CAMERA_TITLE2": "촬영 내용은 저장되지 않으니, 안심하세요. 체험 목적 외에는 사용되지 않습니다.",
		    "PROMOTION_AR_WARRING": "AR 이용 시 주의사항",
		    "PROMOTION_LI1": "주변을 살피며 안전한 장소에서 이용하세요.",
		    "PROMOTION_LI2": "이동 중 사용을 자제하고, 보행 중 사용을 피하세요.",
		    "PROMOTION_LI3": "밝은 환경에서 토큰이 잘 보이도록 해주세요.",
		    "PROMOTION_LI4": "위험지역은 출입을 하지 마시오.",
		    "PROMOTION_LI5": "사유지는 출입을 하지 마세요.",
		    "PROMOTION_LI6": "브라우저 카메라, 위치 권한을 허용해 주세요.",
		    "PROMOTION_AR_WARNING": "AR을 더 잘 즐기는 방법",
		    "NEXT_BTN": "다음",
		    "FACEBOOK_INAPP_INFO_TEXT1": "페이스북 앱내에서는 AR 기능이 제한됩니다.",
			"FACEBOOK_INAPP_INFO_TEXT2": `<span style="font-weight:bold;">'다음'</span> 버튼을 누르면 나오는 팝업에서<span style="font-weight:bold;">'계속하기'</span>를 눌러 AR 세상을 만나보세요.`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `<span style="font-weight:bold;">'다음'</span> 버튼을 누르면 나오는 팝업에서<span style="font-weight:bold;">'열기'</span>를 눌러 AR 세상을 만나보세요.`,
		},
		"en" : {
		    "AR_INDEX_TITLE" : "Rewards Promotion - AR",
			"OPEN_IN_BROWSER": "Open in browser",
			"OPEN_IN_BROWSER2": "Open in browser again",
			"INAPP_INFO_TEXT": "Some features are limited in this browser.<br>Please use another browser.",
		    "INAPP_INFO_TITLE": "Browser Environment Notice",
		    "LOADING_TEXT1" : "We are preparing",
		    "LOADING_TEXT1_2" : "a special experience just for you.",
		    "LOADING_TEXT2" : "Please wait a moment.",
		    "LOADING_APP_BTN": "Start in the official app",
		    "TRY_GAME_DIV1_TEXT1": "First, try collecting<br>tokens on the street.",
			"TRY_GAME_DIV1_TEXT2": "This time, try collecting<br>tokens at the restaurant.",
			"TRY_GAME_INFO_MAIN_TITLE": "Now, turn on your camera and meet a new AR world right where you are.",
			"TRY_GAME_INFO_SUB_TITLE": 'Please allow the permissions below for the AR experience. <span style="font-weight:bold;">without installing the app or logging in.</span>',
			"PERM_TITLE_NEW": "Preparing to open the AR world",
			"BROWSER_ERR1": "This browser may have compatibility issues.",
		    "BROWSER_ERR2": "Upon starting, it will run in ",
		    "BROWSER_ERR3": ".",
		    "EXP_INFO_CAMERA_TITLE2": "The footage is not saved, so please rest assured. It will not be used for any purpose other than the experience.",
		    "PROMOTION_AR_WARRING": "Precautions when using AR",
		    "PROMOTION_LI1": "Please use it in a safe place while looking around.",
		    "PROMOTION_LI2": "Refrain from using while moving, and avoid using while walking.",
		    "PROMOTION_LI3": "Please make sure the token is clearly visible in a bright environment.",
		    "PROMOTION_LI4": "Do not enter the danger zone.",
		    "PROMOTION_LI5": "Please do not enter private property.",
		    "PROMOTION_LI6": "Please allow browser camera and location permissions.",
		    "PROMOTION_AR_WARNING": "How to Enjoy AR Even Better",
		    "NEXT_BTN": "Next",
		    "FACEBOOK_INAPP_INFO_TEXT1": "AR features are restricted within the Facebook app.",
			"FACEBOOK_INAPP_INFO_TEXT2": `Tap <span style="font-weight:bold;">'CONTINUE'</span> in the popup that appears after pressing <span style="font-weight:bold;">'Next'</span> to experience the AR world.`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `Tap <span style="font-weight:bold;">'Open'</span> in the popup that appears after pressing <span style="font-weight:bold;">'Next'</span> to experience the AR world.`,
		},
		"ja": {
		    "AR_INDEX_TITLE" : "リワードプロモーション - AR",
			"OPEN_IN_BROWSER": "ブラウザで開く",
  			"OPEN_IN_BROWSER2": "ブラウザで再度開く",
  			"INAPP_INFO_TEXT": "このブラウザでは一部の機能が制限されています。<br>別のブラウザをご利用ください。",
		    "INAPP_INFO_TITLE": "ブラウザ環境のご案内",
		    "LOADING_TEXT1" : "あなたのための特別な体験を",
		    "LOADING_TEXT1_2" : "準備しています。",
		    "LOADING_TEXT2" : "少々お待ちください。",
		    "LOADING_APP_BTN": "公式アプリで今すぐ始める",
		   	"TRY_GAME_DIV1_TEXT1": "まずは通りで<br>トークンを集めてみましょう。",
			"TRY_GAME_DIV1_TEXT2": "次はレストランで<br>トークンを集めてみましょう。",
			"TRY_GAME_INFO_MAIN_TITLE": "さあ、カメラを起動して 起動して 今あなたの周りで、新しいARの世界に出会いましょう。",
			"TRY_GAME_INFO_SUB_TITLE": 'AR体験のために以下の権限を許可してください。<span style="font-weight:bold;">アプリのインストールやログインなしで</span>',
			"PERM_TITLE_NEW": "ARの世界を開くための準備",
			"BROWSER_ERR1": "現在のブラウザでは互換性の問題が発生する可能性があります。",
		    "BROWSER_ERR2": "開始時に ",
		    "BROWSER_ERR3": " へ移動して実行されます。",
		    "EXP_INFO_CAMERA_TITLE2": "撮影内容は保存されませんのでご安心ください。体験目的以外には使用されません。",
		    "PROMOTION_AR_WARRING": "AR利用時の注意事項",
		    "PROMOTION_LI1": "安全な場所でご利用ください。",
		    "PROMOTION_LI2": "移動中の使用は控え、歩行中は避けてください。",
		    "PROMOTION_LI3": "明るい環境でトークンがはっきり見えるようにしてください。",
		    "PROMOTION_LI4": "危険地域は出入りしないでください。",
		    "PROMOTION_LI5": "私有地は出入りしないでください。",
		    "PROMOTION_LI6": "カメラと位置情報を許可してください。",
		    "PROMOTION_AR_WARNING": "ARをより楽しむために",
		    "NEXT_BTN": "次へ",
		    "FACEBOOK_INAPP_INFO_TEXT1": "Facebookアプリ内ではAR機能が制限されます。",
			"FACEBOOK_INAPP_INFO_TEXT2": `「次へ」ボタンを押すと表示されるポップアップで、<span style="font-weight:bold;">「次へ」</span>をタップしてARの世界をお楽しみください。`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `「次へ」ボタンを押すと表示されるポップアップで、<span style="font-weight:bold;">「開く」</span>をタップしてARの世界をお楽しみください。`,
		},
		"th" : {
		    "AR_INDEX_TITLE" : "โปรโมชั่นรางวัล - AR",
			"OPEN_IN_BROWSER": "เปิดในเบราว์เซอร์",
  			"OPEN_IN_BROWSER2": "เปิดในเบราว์เซอร์อีกครั้ง",
			"INAPP_INFO_TEXT": "เบราว์เซอร์นี้มีข้อจำกัดบางประการ<br>กรุณาใช้เบราว์เซอร์อื่น",
		    "INAPP_INFO_TITLE": "แจ้งสภาพแวดล้อมของเบราว์เซอร์",
		    "LOADING_TEXT1" : "เรากำลังเตรียมประสบการณ์พิเศษ",
		    "LOADING_TEXT1_2" : "สำหรับคุณ",
		    "LOADING_TEXT2" : "กรุณารอสักครู่",
		    "LOADING_APP_BTN": "เริ่มใช้งานทันทีในแอปอย่างเป็นทางการ",
		    "TRY_GAME_DIV1_TEXT1": "ลองสะสมโทเคน<br>บนถนนดูก่อนนะครับ",
			"TRY_GAME_DIV1_TEXT2": "คราวนี้ลองสะสมโทเคน<br>ที่ร้านอาหารดูกันครับ",
			"TRY_GAME_INFO_MAIN_TITLE": "ตอนนี้ เปิดกล้องของคุณ แล้วมาสัมผัสโลก AR ใหม่ รอบตัวคุณได้เลย",
			"TRY_GAME_INFO_SUB_TITLE": 'โปรดอนุญาตสิทธิ์ด้านล่างเพื่อสัมผัสประสบการณ์ AR <span style="font-weight:bold;">ได้ทันทีโดยไม่ต้องติดตั้งแอปหรือล็อกอิน</span>',
			"PERM_TITLE_NEW": "เตรียมความพร้อมเพื่อเปิดโลก AR",
			"BROWSER_ERR1": "เบราว์เซอร์ปัจจุบันอาจมีปัญหาความเข้ากันได้",
		    "BROWSER_ERR2": "เมื่อเริ่มต้น ระบบจะย้ายไปที่ ",
		    "BROWSER_ERR3": " เพื่อใช้งาน",
		    "EXP_INFO_CAMERA_TITLE2": "ภาพที่ถ่ายจะไม่ถูกบันทึก โปรดวางใจ และจะไม่ถูกนำไปใช้เพื่อวัตถุประสงค์อื่นนอกเหนือจากการทดลองใช้งาน",
		    "PROMOTION_AR_WARRING": "ข้อควรระวังในการใช้ AR",
		    "PROMOTION_LI1": "โปรดใช้ในสถานที่ปลอดภัยขณะมองดูรอบ ๆ",
		    "PROMOTION_LI2": "โปรดงดใช้ขณะเคลื่อนไหว และหลีกเลี่ยงการใช้ขณะเดิน",
		    "PROMOTION_LI3": "โปรดทำให้โทเค็นมองเห็นได้ชัดเจนในสภาพแวดล้อมที่สว่าง",
		    "PROMOTION_LI4": "อย่าเข้าไปในเขตอันตราย",
		    "PROMOTION_LI5": "กรุณาอย่าเข้าไปในทรัพย์สินส่วนบุคคล",
		    "PROMOTION_LI6": "กรุณาอนุญาตให้เบราว์เซอร์สามารถเปิดกล้องและระบุตำแหน่งได้",
		    "PROMOTION_AR_WARNING": "วิธีเพลิดเพลินกับ AR ให้มากยิ่งขึ้น",
		    "NEXT_BTN": "ถัดไป",
		    "FACEBOOK_INAPP_INFO_TEXT1": "ฟีเจอร์ AR มีข้อจำกัดในการใช้งานบนแอป Facebook",
			"FACEBOOK_INAPP_INFO_TEXT2": `กด <span style="font-weight:bold;">'ดำเนินการต่อ'</span> ในป๊อปอัพที่ปรากฏขึ้นหลังจากกดปุ่ม <span style="font-weight:bold;">'ถัดไป'</span> เพื่อสัมผัสโลก AR`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `กด <span style="font-weight:bold;">'เปิด'</span> ในป๊อปอัพที่ปรากฏขึ้นหลังจากกดปุ่ม <span style="font-weight:bold;">'ถัดไป'</span> เพื่อสัมผัสโลก AR`,
		},
		"es" : {
		    "AR_INDEX_TITLE" : "Promoción de recompensas - AR",
			"OPEN_IN_BROWSER": "Abrir en navegador",
  			"OPEN_IN_BROWSER2": "Abrir en navegador de nuevo",
  			"INAPP_INFO_TEXT": "Algunas funciones están limitadas en este navegador.<br>Utilice otro navegador.",
		    "INAPP_INFO_TITLE": "Aviso sobre el entorno del navegador",
		    "LOADING_TEXT1" : "Estamos preparando",
		    "LOADING_TEXT1_2" : "una experiencia especial para ti.",
		    "LOADING_TEXT2" : "Por favor espere un momento.",
		    "LOADING_APP_BTN": "Comenzar ahora en la app oficial",
		    "TRY_GAME_DIV1_TEXT1": "Primero, intenta recolectar<br>tokens en la calle.",
			"TRY_GAME_DIV1_TEXT2": "Esta vez, intenta recolectar<br>tokens en el restaurante.",
			"TRY_GAME_INFO_MAIN_TITLE": "Ahora, enciende tu cámara y descubre un nuevo mundo de RA a tu alrededor.",
			"TRY_GAME_INFO_SUB_TITLE": 'Por favor, concede los siguientes permisos para la experiencia de RA. <span style="font-weight:bold;">sin instalar la app ni iniciar sesión</span>',
			"PERM_TITLE_NEW": "Preparándonos para abrir el mundo de RA",
			"BROWSER_ERR1": "Este navegador puede tener problemas de compatibilidad.",
		    "BROWSER_ERR2": "Al iniciar, se abrirá en ",
		    "BROWSER_ERR3": " para continuar.",
		    "EXP_INFO_CAMERA_TITLE2": "El contenido grabado no se guarda, así que puedes estar tranquilo. No se utilizará para ningún propósito distinto al de la experiencia.",
		    "PROMOTION_AR_WARRING": "Precauciones al utilizar AR",
		    "PROMOTION_LI1": "Úselo en un lugar seguro mientras mira a su alrededor.",
		    "PROMOTION_LI2": "Evite usarlo mientras se desplaza y no lo use mientras camina.",
		    "PROMOTION_LI3": "Asegúrese de que el token sea claramente visible en un entorno iluminado.",
		    "PROMOTION_LI4": "No entrar en la zona de peligro.",
		    "PROMOTION_LI5": "Por favor, no entrar en propiedad privada.",
		    "PROMOTION_LI6": "Permita los permisos de cámara y ubicación del navegador.",
		    "PROMOTION_AR_WARNING": "Cómo disfrutar mejor del AR",
		    "NEXT_BTN": "Siguiente",
		    "FACEBOOK_INAPP_INFO_TEXT1": "Las funciones de AR están restringidas en la aplicación de Facebook.",
			"FACEBOOK_INAPP_INFO_TEXT2": `Pulsa <span style="font-weight:bold;">'CONTINUAR'</span> en la ventana emergente que aparece al pulsar <span style="font-weight:bold;">'Siguiente'</span> para descubrir el mundo AR.`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `Pulsa <span style="font-weight:bold;">'Abrir'</span> en la ventana emergente que aparece al pulsar <span style="font-weight:bold;">'Siguiente'</span> para descubrir el mundo AR.`,
		},
		"vi" : {
		    "AR_INDEX_TITLE" : "Khuyến mãi phần thưởng - AR",
			"OPEN_IN_BROWSER": "Mở bằng trình duyệt",
  			"OPEN_IN_BROWSER2": "Mở lại bằng trình duyệt",
  			"INAPP_INFO_TEXT": "Một số tính năng bị hạn chế trên trình duyệt này.<br>Vui lòng sử dụng trình duyệt khác.",
		    "INAPP_INFO_TITLE": "Thông báo môi trường trình duyệt",
		    "LOADING_TEXT1" : "Chúng tôi đang chuẩn bị",
		    "LOADING_TEXT1_2" : "một trải nghiệm đặc biệt dành cho bạn.",
		    "LOADING_TEXT2" : "Vui lòng đợi một chút.",
		    "LOADING_APP_BTN": "Bắt đầu ngay trong ứng dụng chính thức",
		    "TRY_GAME_DIV1_TEXT1": "Trước tiên, hãy thử thu thập<br>token trên đường phố nhé.",
			"TRY_GAME_DIV1_TEXT2": "Lần này, hãy thử thu thập<br>token tại nhà hàng nhé.",
			"TRY_GAME_INFO_MAIN_TITLE": "Bây giờ, hãy bật camera và khám phá thế giới AR mới ngay xung quanh bạn.",
			"TRY_GAME_INFO_SUB_TITLE": 'Vui lòng cấp các quyền bên dưới để trải nghiệm AR. <span style="font-weight:bold;">ngay lập tức mà không cần cài đặt ứng dụng hay đăng nhập</span>',
			"PERM_TITLE_NEW": "Chuẩn bị để mở ra thế giới AR",
			"BROWSER_ERR1": "Trình duyệt hiện tại có thể gặp sự cố tương thích.",
		    "BROWSER_ERR2": "Khi bắt đầu, bạn sẽ được chuyển sang ",
		    "BROWSER_ERR3": " để chạy ứng dụng.",
		    "EXP_INFO_CAMERA_TITLE2": "Nội dung ghi hình sẽ không được lưu lại, vì vậy bạn có thể yên tâm. Chỉ được sử dụng cho mục đích trải nghiệm.",
		    "PROMOTION_AR_WARRING": "Thận trọng khi sử dụng AR",
		    "PROMOTION_LI1": "Hãy sử dụng ở nơi an toàn khi quan sát xung quanh.",
		    "PROMOTION_LI2": "Hạn chế sử dụng khi đang di chuyển và tránh sử dụng khi đang đi bộ.",
		    "PROMOTION_LI3": "Hãy đảm bảo token được nhìn thấy rõ ràng trong môi trường sáng.",
		    "PROMOTION_LI4": "Không được vào khu vực nguy hiểm.",
		    "PROMOTION_LI5": "Xin vui lòng không vào khu vực tài sản tư nhân.",
		    "PROMOTION_LI6": "Vui lòng cấp quyền sử dụng camera và vị trí của trình duyệt.",
		    "PROMOTION_AR_WARNING": "Cách tận hưởng AR tốt hơn",
		    "NEXT_BTN": "Tiếp theo",
		    "FACEBOOK_INAPP_INFO_TEXT1": "Các tính năng AR bị hạn chế trong ứng dụng Facebook.",
			"FACEBOOK_INAPP_INFO_TEXT2": `Nhấn <span style="font-weight:bold;">'TIẾP TỤC'</span> trong cửa sổ bật lên xuất hiện sau khi nhấn <span style="font-weight:bold;">'Tiếp theo'</span> để trải nghiệm thế giới AR.`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `Nhấn <span style="font-weight:bold;">'Mở'</span> trong cửa sổ bật lên xuất hiện sau khi nhấn <span style="font-weight:bold;">'Tiếp theo'</span> để trải nghiệm thế giới AR.`,
		},
		"pt" : {
		    "AR_INDEX_TITLE" : "Promoção de Recompensas - RA",
		    "OPEN_IN_BROWSER": "Abrir no navegador",
  			"OPEN_IN_BROWSER2": "Abrir novamente no navegador",
  			"INAPP_INFO_TEXT": "Alguns recursos estão limitados neste navegador.<br>Use outro navegador.",
		    "INAPP_INFO_TITLE": "Aviso sobre o ambiente do navegador",
		    "LOADING_TEXT1" : "Estamos preparando",
		    "LOADING_TEXT1_2" : "uma experiência especial para você.",
		    "LOADING_TEXT2" : "Por favor, aguarde um momento.",
		    "LOADING_APP_BTN": "Começar agora no app oficial",		
			"TRY_GAME_DIV1_TEXT1": "Primeiro, tente coletar<br>tokens na rua.",
			"TRY_GAME_DIV1_TEXT2": "Desta vez, tente coletar<br>tokens no restaurante.",
			"TRY_GAME_INFO_MAIN_TITLE": "Agora, ligue sua câmera e encontre um novo mundo de RA ao seu redor.",
			"TRY_GAME_INFO_SUB_TITLE": 'Por favor, permita as permissões abaixo para a experiência de RA. <span style="font-weight:bold;">sem instalar o aplicativo ou fazer login</span>',
			"PERM_TITLE_NEW": "Preparando para abrir o mundo de RA",
			"BROWSER_ERR1": "Este navegador pode ter problemas de compatibilidade.",
		    "BROWSER_ERR2": "Ao iniciar, você será redirecionado ao ",
		    "BROWSER_ERR3": " para executar.",
		    "EXP_INFO_CAMERA_TITLE2": "O conteúdo capturado não é salvo, então fique tranquilo. Não será usado para nenhuma finalidade além da experiência.",
		    "PROMOTION_AR_WARRING": "Precauções ao usar RA",
		    "PROMOTION_LI1": "Use em um local seguro enquanto observa ao redor.",
		    "PROMOTION_LI2": "Evite usar enquanto se desloca e não use enquanto caminha.",
		    "PROMOTION_LI3": "Certifique-se de que o token esteja visível em um ambiente iluminado.",
		    "PROMOTION_LI4": "Não entre em áreas de perigo.",
		    "PROMOTION_LI5": "Por favor, não entre em propriedade privada.",
		    "PROMOTION_LI6": "Permita permissões de câmera e localização no navegador.",
		    "PROMOTION_AR_WARNING": "Como aproveitar melhor o AR",
		    "NEXT_BTN": "Próximo",
		    "FACEBOOK_INAPP_INFO_TEXT1": "Os recursos de AR são restritos no aplicativo do Facebook.",
			"FACEBOOK_INAPP_INFO_TEXT2": `Clique em <span style="font-weight:bold;">'CONTINUAR'</span> no pop-up que aparece após clicar em <span style="font-weight:bold;">'Próximo'</span> para explorar o mundo AR.`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `Clique em <span style="font-weight:bold;">'Abrir'</span> no pop-up que aparece após clicar em <span style="font-weight:bold;">'Próximo'</span> para explorar o mundo AR.`,
		},
		"km" : {
		    "AR_INDEX_TITLE" : "ប្រូម៉ូសិនរង្វាន់ - AR",
			"INAPP_INFO_TEXT": "មុខងារមួយចំនួនត្រូវបានដាក់កម្រិតលើ Browser នេះ។<br>សូមប្តូរទៅប្រើ Browser ផ្សេង។",
		    "INAPP_INFO_TITLE": "ការណែនាំអំពីបរិយាកាស Browser",
			"OPEN_IN_BROWSER": "បើកក្នុង Browser",
			"OPEN_IN_BROWSER2": "បើកម្តងទៀតក្នុង Browser",
			"LOADING_TEXT1" : "យើងកំពុងរៀបចំបទពិសោធន៍ពិសេស",
			"LOADING_TEXT1_2" : "សម្រាប់អ្នក",
			"LOADING_TEXT2" : "សូមរង់ចាំបន្តិច។",
			"LOADING_APP_BTN": "ចាប់ផ្តើមភ្លាមៗក្នុងកម្មវិធីផ្លូវការ",
			"TRY_GAME_DIV1_TEXT1": "ដំបូង សូមព្យាយាមប្រមូល<br>ថូខឹននៅតាមផ្លូវ។",
			"TRY_GAME_DIV1_TEXT2": "លើកនេះ សូមព្យាយាមប្រមូល<br>ថូខឹននៅភោជនីយដ្ឋានវិញម្តង។",
			"TRY_GAME_INFO_MAIN_TITLE": "ឥឡូវនេះ បើកកាមេរ៉ារបស់អ្នក ហើយជួបជាមួយពិភព AR ថ្មី នៅជុំវិញខ្លួនអ្នក។",
			"TRY_GAME_INFO_SUB_TITLE": 'សូមអនុញ្ញាតសិទ្ធិខាងក្រោមសម្រាប់បទពិសោធន៍ AR។ <span style="font-weight:bold;">បានភ្លាមៗដោយមិនចាំបាច់ដំឡើងកម្មវិធី ឬចូលគណនី</span>',
			"PERM_TITLE_NEW": "ការត្រៀមលក្ខណៈដើម្បីបើកពិភព AR",
			"BROWSER_ERR1": "Browser បច្ចុប្បន្នអាចមានបញ្ហាមិនស៊ីគ្នា។",
		    "BROWSER_ERR2": "ពេលចាប់ផ្តើម វានឹងដំណើរការដោយប្តូរទៅ ",
		    "BROWSER_ERR3": " ។",
		    "EXP_INFO_CAMERA_TITLE2": "មាតិកាដែលថតនឹងមិនត្រូវបានរក្សាទុកទេ សូមទុកចិត្តបាន។ វានឹងមិនត្រូវបានប្រើសម្រាប់គោលបំណងផ្សេងក្រៅពីការសាកល្បងទេ។",
		    "PROMOTION_AR_WARRING": "ការប្រុងប្រយ័ត្នពេលប្រើ AR",
		    "PROMOTION_LI1": "សូមពិនិត្យមើលជុំវិញ និងប្រើប្រាស់ក្នុងទីតាំងដែលមានសុវត្ថិភាព។",
		    "PROMOTION_LI2": "ជៀសវាងការប្រើប្រាស់ពេលកំពុងធ្វើដំណើរ ឬកំពុងដើរ។",
		    "PROMOTION_LI3": "សូមប្រើក្នុងទីតាំងដែលមានពន្លឺគ្រប់គ្រាន់ដើម្បីឱ្យឃើញថូខឹនច្បាស់។",
		    "PROMOTION_LI4": "ហាមចូលក្នុងតំបន់គ្រោះថ្នាក់។",
		    "PROMOTION_LI5": "ហាមចូលក្នុងទីតាំងឯកជន។",
		    "PROMOTION_LI6": "សូមអនុញ្ញាតសិទ្ធិប្រើប្រាស់កាមេរ៉ា និងទីតាំងលើកម្មវិធីរុករក (Browser)។",
		    "PROMOTION_AR_WARNING": "របៀបរីករាយជាមួយ AR ឱ្យបានកាន់តែប្រសើរ",
		    "NEXT_BTN": "បន្ទាប់",
		    "FACEBOOK_INAPP_INFO_TEXT1": "មុខងារ AR ត្រូវបានដាក់កម្រិតនៅក្នុងកម្មវិធី Facebook។",
			"FACEBOOK_INAPP_INFO_TEXT2": `សូមចុច <span style="font-weight:bold;">'បន្ត'</span> នៅលើផ្ទាំង Pop-up ដែលបង្ហាញឡើងបន្ទាប់ពីចុចប៊ូតុង <span style="font-weight:bold;">'បន្ទាប់'</span> ដើម្បីជួបជាមួយពិភព AR។`,
			"FACEBOOK_INAPP_INFO_TEXT2_ios": `សូមចុច <span style="font-weight:bold;">'បើក'</span> នៅលើផ្ទាំង Pop-up ដែលបង្ហាញឡើងបន្ទាប់ពីចុចប៊ូតុង <span style="font-weight:bold;">'បន្ទាប់'</span> ដើម្បីជួបជាមួយពិភព AR។`,
		}
}


// ===== 2) 언어 결정 =====
function getLangParam() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("lang");
}

function getLang() {
  // 1) URL 파라미터
  const urlLang = getLangParam();
  if (SUPPORTED_LANGS.includes(urlLang)) return urlLang;

  // 2) 브라우저 언어들 가져오기
  const browserLangs = (navigator.languages || [navigator.language || "en"])
    .map(l => l.slice(0,2));  // "en-US" → "en"

  // 3) 내가 정한 우선순위 순서대로 검사
//  for (const pref of FALLBACK_PRIORITY) {
//    if (browserLangs.includes(pref) && SUPPORTED_LANGS.includes(pref)) {
//      return pref;
//    }
//  }

  // 4) 그래도 없으면 fallback (내 배열 첫번째)
  //return FALLBACK_PRIORITY[0] || "en";
  return browserLangs[0] || "en";
}

// (선택) URL에 lang 없으면 붙여줌
(function ensureLangInUrl() {
  const urlLang = getLangParam();
  if (!SUPPORTED_LANGS.includes(urlLang)) {
    const fallback = getLang();
    const u = new URL(location.href);
    //u.searchParams.set("lang", fallback);
    //if (u.toString() !== location.href) location.replace(u.toString());
  }
})();

// ===== 3) 전역 변수 생성 (ko_KEY / en_KEY / ... + 현재언어용 lang_KEY) =====
function initLangVarsAll() {
  Object.keys(lang).forEach(L => {
    const dict = lang[L];
    Object.keys(dict).forEach(k => {
      window[`${L}_${k}`] = dict[k];      // 예: en_COUPON_CHECK
    });
  });
}
function initLangVarsCurrent() {
  const L = getLang();
  const dict = lang[L] || lang.en;
  Object.keys(dict).forEach(k => {
    window[`lang_${k}`] = dict[k];        // 예: lang_COUPON_CHECK
  });
}

// ===== 4) 문자열 치환기: "${lang_KEY}" 들을 실제 값으로 바꿈 =====
function resolveLangTemplate(str) {
  if (typeof str !== "string" || !str.includes("${")) return str;
  // ${lang_KEY} -> window.lang_KEY
  return str.replace(/\$\{(lang_[A-Z0-9_]+)\}/g, (_, v) => {
    const val = window[v];
    return (val !== undefined && val !== null) ? String(val) : _;
  }).replace(/\$\{((ko|en|ja|th|vi|es|pt|km)_[A-Z0-9_]+)\}/g, (_, v) => {
    const val = window[v];
    return (val !== undefined && val !== null) ? String(val) : _;
  });
}

// ===== 5) DOM 전체를 한 번에 치환 =====
function i18nApplyPlaceholders(root=document) {
  // 5-1) <title>, <meta>
  if (document.title) document.title = resolveLangTemplate(document.title);

  document.querySelectorAll('meta[content]').forEach(m => {
    m.setAttribute('content', resolveLangTemplate(m.getAttribute('content')));
  });

  // 5-2) 텍스트/HTML 노드
  // 안전하게 속성만 바꿔도 되지만, 이미 HTML 내에 ${...}가 있으니 innerHTML 치환도 수행
  const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_ELEMENT, null);
  const attrNames = ["aria-label","title","alt","placeholder","value","data-label"];
  while (walker.nextNode()) {
    const el = walker.currentNode;

    // innerHTML에 ${...}가 있으면 치환
    if (el.innerHTML && el.innerHTML.includes("${")) {
      el.innerHTML = resolveLangTemplate(el.innerHTML);
    }

    // 대표 속성들 치환
    for (const name of attrNames) {
      if (el.hasAttribute && el.hasAttribute(name)) {
        const v = el.getAttribute(name);
        const nv = resolveLangTemplate(v);
        if (nv !== v) el.setAttribute(name, nv);
      }
    }
  }
}

// ===== 6) 동적 추가에도 대응 (선택) =====
const i18nObserver = new MutationObserver(muts => {
  for (const m of muts) {
    m.addedNodes.forEach(n => {
      if (n.nodeType === 1) i18nApplyPlaceholders(n);
    });
    if (m.type === "attributes") {
      const el = m.target;
      const v = el.getAttribute(m.attributeName);
      const nv = resolveLangTemplate(v);
      if (nv !== v) el.setAttribute(m.attributeName, nv);
    }
  }
});

function initI18n() {
  initLangVarsAll();
  initLangVarsCurrent();
  i18nApplyPlaceholders(document);

  // SweetAlert 등 동적 DOM 대응
  i18nObserver.observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label","title","alt","placeholder","value","content"]
  });
  document.dispatchEvent(new Event('i18n:ready'));
}
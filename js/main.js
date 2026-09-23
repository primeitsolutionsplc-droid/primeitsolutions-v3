(function(){
  var root = document.documentElement;
  function $(s, c){ return (c||document).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var store = {
    get: function(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set: function(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  };

  /* ---- Sinhala strings (English is the text already in the HTML) ---- */
  var SI = {
    'skip':'අන්තර්ගතයට පිවිසෙන්න','hero.badge':'මෘදුකාංග ඉංජිනේරු සමාගම','mq1':'වෙබ් අඩවි','mq2':'POS පද්ධති','mq3':'ව්‍යාපාරික පද්ධති','mq4':'විශ්වවිද්‍යාල ව්‍යාපෘති','mq5':'අභිරුචි වෙබ් යෙදුම්',
    'nav.services':'සේවාවන්','nav.pos':'POS ආදර්ශනය','nav.students':'සිසුන් සඳහා','nav.process':'ක්‍රියාවලිය','nav.faq':'ප්‍රශ්න','nav.contact':'අමතන්න','nav.cta':'නොමිලේ මිල ගණන්',
    'hero.h1':'ඔබේ ව්‍යාපාරය ක්‍රියාත්මක වන මෘදුකාංග අපි නිර්මාණය කරමු.',
    'hero.sub':'Prime IT Solutions යනු මෘදුකාංග ඉංජිනේරු සමාගමකි. අපි වෙබ් අඩවි, POS පද්ධති සහ ව්‍යාපාර සඳහා අභිරුචි මෘදුකාංග සාදන අතර, විශ්වවිද්‍යාල සිසුන් සඳහා IT ව්‍යාපෘති ද සාදා දෙමු.',
    'hero.scroll':'පහළට ස්ක්‍රෝල් කර වෙනස් වන ආකාරය බලන්න','hero.btn1':'ව්‍යාපෘතියක් අරඹමු','hero.btn2':'අපි සාදන දේ බලන්න','hero.call':'කතා කිරීමට කැමතිද? අමතන්න',
    'svc.h2':'ව්‍යාපාරයකට අවශ්‍ය සියල්ල, එකම කණ්ඩායමකින්.','svc.intro':'ඇතුළත් දේ බැලීමට සේවාවක් තෝරන්න.','ask':'මේ සේවාව ගැන අසන්න',
    's1.n':'ව්‍යාපාරික වෙබ් අඩවි','s1.t':'සෑම දුරකථනයකම හොඳින් ක්‍රියා කරන, වේගවත්, ලස්සන වෙබ් අඩවියක්.',
    's1.a':'සමාගම් සහ පෝට්ෆෝලියෝ අඩවි','s1.b':'ඔන්ලයින් වෙළඳසැල්','s1.c':'වෙන්කිරීම් සහ සම්බන්ධතා පෝරම','s1.d':'දුරකථනයට ගැලපෙන නිර්මාණය',
    's2.n':'ව්‍යාපාරික පද්ධති','s2.t':'ඔබේ ව්‍යාපාරය දැනටමත් ක්‍රියා කරන ආකාරයට ගැලපෙන මෘදුකාංග.',
    's2.a':'තොග පාලනය','s2.b':'පාරිභෝගික සහ ඇණවුම් වාර්තා','s2.c':'වාර්තා සහ ඩෑෂ්බෝඩ්','s2.d':'විවිධ අවසර සහිත සේවක ලොගින්',
    's3.n':'POS පද්ධති','s3.t':'සාප්පු සහ ආපන ශාලා සඳහා බිල්පත් සහ තොග එකම තැනක.',
    's3.a':'වේගවත් බිල්පත් සහ රිසිට්පත්','s3.b':'සෑම විකුණුමක් සමඟම යාවත්කාලීන වන තොග','s3.c':'දෛනික සහ මාසික විකුණුම් වාර්තා','s3.d':'එකම පද්ධතියේ කැෂියර්වරුන් කිහිප දෙනෙක්',
    's4.n':'විශ්වවිද්‍යාල IT ව්‍යාපෘති','s4.t':'අවසන් වසර, පර්යේෂණ සහ කණ්ඩායම් ව්‍යාපෘති, ඔබ සමඟ එක්ව.',
    's4.a':'පද්ධති සැලසුම සහ දත්ත ගබඩාව','s4.b':'වෙබ් සහ මෘදුකාංග සංවර්ධනය','s4.c':'ලේඛන සහ වාර්තා','s4.d':'සෑම කොටසක්ම ඔබට පැහැදිලි කළ හැකි වන පරිදි මඟ පෙන්වීම',
    's5.n':'අභිරුචි වෙබ් සංවර්ධනය','s5.t':'වෙනත් අදහසක් තිබේද? අපි ඕනෑම කෙනෙකුට වෙබ් පිටු සහ යෙදුම් සාදා දෙමු.',
    's5.a':'ලෑන්ඩිං පිටු','s5.b':'වෙබ් යෙදුම් සහ ඩෑෂ්බෝඩ්','s5.c':'පැරණි අඩවි නැවත සැලසුම් කිරීම','s5.d':'දෝෂ නිවැරදි කිරීම් සහ වැඩිදියුණු කිරීම්',
    'pos.h2':'බ්‍රව්සරයෙන්ම POS එකක් අත්හදා බලන්න.',
    'pos.p':'අප සාදන POS පද්ධති වර්ගයේ කුඩා ආදර්ශනයකි. අයිතම මත ඔබා බිල්පතට එක් කරන්න. ඔබේ පද්ධතිය ඔබේ සාප්පුවට, ඔබේ නිෂ්පාදන, මිල ගණන් සහ වාර්තා සමඟ සාදනු ලැබේ.',
    'pos.btn':'POS පද්ධතියක් ගැන අසන්න','pos.till':'ආදර්ශන කවුන්ටරය','pos.bill':'බිල්පත','pos.empty':'බිල්පතක් ආරම්භ කිරීමට අයිතම එක් කරන්න.','pos.total':'එකතුව','pos.clear':'මකන්න','pos.pay':'විකුණුම අවසන් කරන්න',
    'pos.done':'විකුණුම අවසන්. බිල්පත #{n}, {total}.','pos.first':'විකුණුම අවසන් කිරීමට පෙර අයිතම එක් කරන්න.',
    'stu.h2':'ඔබේ අවසන් වසර ව්‍යාපෘතිය සකසමින් සිටින්නේද?',
    'stu.p':'ඔබේ මාතෘකාව, අවශ්‍යතා සහ අවසන් දිනය අප වෙත ගෙන එන්න. අපි ඔබ සමඟ පද්ධතිය සැලසුම් කර, සාදා, සෑම කොටසක්ම ඔබට තේරෙන ලෙස පැහැදිලි කරමු.',
    'stu.t1':'කළමනාකරණ පද්ධති','stu.t2':'වෙබ් යෙදුම්','stu.t3':'දත්ත ගබඩා ව්‍යාපෘති','stu.t4':'පර්යේෂණ මූලාකෘති','stu.btn':'ඔබේ ව්‍යාපෘතිය ගැන අපට පණිවිඩයක් එවන්න',
    'proc.h2':'ව්‍යාපෘතියක් ක්‍රියාත්මක වන ආකාරය','proc.intro':'අදහසේ සිට දියත් කිරීම දක්වා පියවර හතරක්.',
    'p1.n':'ඔබට අවශ්‍ය දේ අපට කියන්න','p1.d':'අමතන්න, පණිවිඩයක් යවන්න හෝ පෝරමය භාවිතා කරන්න. ඔබේ අරමුණ, කාලසීමාව සහ ඔබ කැමති උදාහරණ අපට කියන්න.',
    'p2.n':'සැලසුමක් සහ මිලක් ලබාගන්න','p2.d':'අපි සාදන දේ, ගතවන කාලය සහ මිල සමඟ පිළිතුරු දෙමු. පසුව අනපේක්ෂිත වියදම් නැත.',
    'p3.n':'අපි සාදමු, ඔබ පරීක්ෂා කරන්න','p3.d':'අපි වැඩ කරන අතරතුර ඔබට ප්‍රගතිය දැක ගත හැකි අතර, වෙනස්කම් ඉල්ලා සිටිය හැක.',
    'p4.n':'දියත් කිරීම සහ සහාය','p4.d':'අපි එය සජීවී කර, භාවිතා කරන ආකාරය පෙන්වා, යමක් නිවැරදි කිරීමට අවශ්‍ය වුවහොත් ඔබ සමඟ සිටිමු.',
    'faq.h2':'අපෙන් නිතර අසන ප්‍රශ්න',
    'q1.q':'මිල කීයද?','q1.a':'මිල ඔබට අවශ්‍ය දේ මත රඳා පවතී. විස්තර එවන්න, අපි නොමිලේ පැහැදිලි මිල ගණනක් දෙන්නෙමු.',
    'q2.q':'මට තාක්ෂණික දැනුමක් නැත. එහෙත් ඔබ සමඟ වැඩ කළ හැකිද?','q2.a':'ඔව්. ඔබේ අදහස සිංහලෙන් හෝ ඉංග්‍රීසියෙන් ඔබේම වචනවලින් කියන්න. අපි එය සැලැස්මක් බවට පත් කරමු.',
    'q3.q':'ව්‍යාපෘතියකට කොපමණ කාලයක් ගතවේද?','q3.a':'සරල වෙබ් අඩවියකට දින කිහිපයක් ගත විය හැක. පද්ධති සහ POS සඳහා වැඩි කාලයක් අවශ්‍ය වේ. මිල ගණන සමඟ කාල සටහනක් ලබා දෙන්නෙමු.',
    'q4.q':'මගේ විශ්වවිද්‍යාල ව්‍යාපෘතියට උදව් කළ හැකිද?','q4.a':'ඔව්. අපි සිසු ව්‍යාපෘති සාදා මඟ පෙන්වන අතර, ඔබට විශ්වාසයෙන් ඉදිරිපත් කළ හැකි වන පරිදි සෑම කොටසක්ම පැහැදිලි කරමු.',
    'q5.q':'ව්‍යාපෘතිය අවසන් වූ පසු ඔබ උදව් කරනවාද?','q5.a':'ඔව්. යමක් කැඩුණහොත් හෝ වෙනසක් අවශ්‍ය නම් අපට පණිවිඩයක් එවන්න, අපි විසඳා දෙන්නෙමු.',
    'ct.h2':'ඔබට අවශ්‍ය දේ අපට කියන්න.','ct.p':'පෝරමය පුරවා WhatsApp හෝ ඊමේල් මගින් එවන්න. හැකි ඉක්මනින් පිළිතුරු දෙන්නෙමු.','ct.call':'අමතන්න','ct.email':'ඊමේල්',
    'f.name':'ඔබේ නම','f.phone':'දුරකථන අංකය','f.need':'මට අවශ්‍ය වන්නේ','f.details':'විස්තර','f.ph':'ඔබේ අදහස, කාලසීමාව සහ ඔබ කැමති උදාහරණ අපට කියන්න.',
    'o1':'ව්‍යාපාරික වෙබ් අඩවියක්','o2':'ව්‍යාපාරික පද්ධතියක්','o3':'POS පද්ධතියක්','o4':'විශ්වවිද්‍යාල IT ව්‍යාපෘතියක්','o5':'වෙනත් දෙයක්',
    'f.wa':'WhatsApp හරහා යවන්න','f.mail':'ඊමේල් මගින් යවන්න',
    'form.err':'කරුණාකර ඔබේ නම සහ විස්තර කිහිපයක් එක් කරන්න.','form.wa':'ඔබේ පණිවිඩය සමඟ WhatsApp විවෘත වෙමින් පවතී.','form.mail':'ඔබේ පණිවිඩය සමඟ ඊමේල් යෙදුම විවෘත වෙමින් පවතී.',
    'ft.p':'මෘදුකාංග ඉංජිනේරු සමාගමක්. වෙබ් අඩවි, POS සහ ව්‍යාපාරික පද්ධති, සහ විශ්වවිද්‍යාල සිසුන් සඳහා IT ව්‍යාපෘති.',
    'ft.c':'© 2026 Prime IT Solutions. සියලුම හිමිකම් ඇවිරිණි.',
    'hero.badge':'නව ව්‍යාපෘති සඳහා දැන් සූදානම්','hero.h1a':'ඔබේ ව්‍යාපාරය ඉදිරියට ගෙනයන','hero.h1b':'අපි නිර්මාණය කරමු.',
    'hero.words':'වෙබ් අඩවි, POS පද්ධති, ව්‍යාපාරික මෘදුකාංග සහ වෙබ් යෙදුම්.',
    'hero.btn1':'නොමිලේ මිල ගණනක් ගන්න','hero.btn2':'නිදර්ශන වැඩ බලන්න',
    'hero.t1':'නොමිලේ, පැහැදිලි මිල ගණන්','hero.t2':'සිංහල සහ ඉංග්‍රීසි','hero.t3':'දියත් කළ පසුවත් සහාය',
    'fl.1':'නව විකුණුමක්','fl.2':'වෙබ් අඩවිය','fl.2b':'සජීවීයි','fl.3':'මේ සතියේ විකුණුම්',
    'nav.work':'අපේ වැඩ',
    'why.eye':'ඇයි Prime IT','why.h2':'ඔබේ ව්‍යාපෘතිය අපට විශ්වාසයෙන් භාර දිය හැක්කේ ඇයි.','why.intro':'තේරුම් නොගත හැකි තාක්ෂණික වචන නැත, අනපේක්ෂිත බිල්පත් නැත, දියත් කළ පසු අතුරුදහන් වීමක් ද නැත.',
    'w1.h':'ආරම්භයට පෙර පැහැදිලි මිලක්','w1.d':'ඔබේ අදහස කියන්න. අපි සාදන දේ, ගතවන කාලය සහ මිල සමඟ ලිඛිත සැලැස්මක් ලබා දෙමු. නොමිලේ, පසුව සැඟවුණු වියදම් නැතිව.',
    'qm.t':'ඔබේ මිල ගණන','qm.free':'නොමිලේ','qm.1':'අපි සාදන දේ','qm.2':'කාල සටහන','qm.3':'මුළු මිල','qm.4':'අනපේක්ෂිත දේ නැත',
    'w2.h':'සාදන අතරතුරම බලන්න','w2.d':'වැඩ කරන අතරතුර ප්‍රගතිය පරීක්ෂා කර, සජීවී කිරීමට පෙර වෙනස්කම් ඉල්ලන්න.',
    'w3.h':'සිංහලෙන් හෝ ඉංග්‍රීසියෙන් කතා කරන්න','w3.d':'ඔබේ අදහස ඔබේම වචනවලින් කියන්න. තාක්ෂණික දැනුමක් අවශ්‍ය නැත.',
    'w4.h':'මුල සිට අගට එකම කණ්ඩායම','w4.d':'වෙබ් අඩවි, පද්ධති සහ POS එකම කණ්ඩායමක් සාදන නිසා සියල්ල එකට හොඳින් ක්‍රියා කරයි.',
    'w5.h':'භාවිතා කරන හැටි පෙන්වා දෙමු','w5.d':'භාරදීමේදී සියල්ල පැහැදිලි කර දෙන නිසා ඔබට සහ ඔබේ කාර්ය මණ්ඩලයට විශ්වාසයෙන් භාවිතා කළ හැක.',
    'w6.h':'දියත් කළ පසුවත් අපි සිටිමු','w6.d':'යමක් කැඩුණාද, වෙනසක් අවශ්‍යද? පණිවිඩයක් එවන්න, අපි විසඳා දෙමු.',
    's3.try':'සජීවී ආදර්ශනය බලන්න','s6.n':'ඔබට අවශ්‍ය දේ ගැන විශ්වාස නැද්ද?','s6.t':'ගැටලුව අපට කියන්න. එය විසඳන සරලම විසඳුම අපි යෝජනා කරමු.','s6.b':'අප හා කතා කරන්න',
    'show.eye':'නිදර්ශන වැඩ','show.h2':'ඔබේ එක පෙනෙන්නේ කොහොමද කියා බලන්න.','show.p':'මේවා අපගේ වැඩවල ශෛලිය සහ ගුණාත්මකභාවය පෙන්වන නිදර්ශන නිර්මාණ ය. ඔබේ එක ඔබේ ව්‍යාපාරය, සන්නාමය සහ පාරිභෝගිකයින් වටා නිර්මාණය කෙරේ.',
    'tab1':'ව්‍යාපාරික වෙබ් අඩවිය','tab2':'ව්‍යාපාරික ඩෑෂ්බෝඩ්','tab3':'සිසු ව්‍යාපෘතිය','sample':'නිදර්ශන නිර්මාණයකි',
    'cap1':'මෙනුව, මේස වෙන්කිරීම් සහ දුරකථනයට ගැලපෙන පිරිසැලසුමක් සහිත ආපන ශාලා වෙබ් අඩවියක්.',
    'cap2':'සෑම බිල්පතක් සමඟම යාවත්කාලීන වන විකුණුම්, තොග සහ කාර්ය මණ්ඩලය එකම තිරයක.',
    'cap3':'දත්ත ගබඩාව, පරිපාලක පැනලය සහ සම්පූර්ණ ලේඛන සහිත අවසන් වසර පුස්තකාල පද්ධතියක්.',
    'pos.hint':'උත්සාහ කරන්න: අයිතමයක් ඔබන්න',
    'cta.h2':'අදහසක් තිබේද? අපි එකට එය සාදමු.','cta.p':'නොමිලේ මිල ගණන්. සරල වචන. සිංහල හෝ ඉංග්‍රීසි.','cta.wa':'WhatsApp හරහා කතා කරන්න',
    'f.priv':'ඔබේ විස්තර භාවිතා කරන්නේ ඔබට පිළිතුරු දීමට පමණි.',
    'svc.intro':'ඔබේ ව්‍යාපාරයට ගැලපෙන දේ තෝරන්න, නැතහොත් ඔබේ අදහස අපට කියන්න.'
  };

  /* headings with a highlighted (gradient) phrase: trusted static strings, set as HTML */
  var SI_HTML = {
    'why.h2':'ඔබේ ව්‍යාපෘතිය අපට <em>විශ්වාසයෙන්</em> භාර දිය හැක්කේ ඇයි.',
    'svc.h2':'ව්‍යාපාරයකට අවශ්‍ය සියල්ල, <em>එකම කණ්ඩායමකින්.</em>',
    'show.h2':'ඔබේ එක <em>පෙනෙන්නේ කොහොමද</em> කියා බලන්න.',
    'pos.h2':'<em>බ්‍රව්සරයෙන්ම</em> POS එකක් අත්හදා බලන්න.',
    'stu.h2':'ඔබේ <em>අවසන් වසර ව්‍යාපෘතිය</em> සකසමින් සිටින්නේද?',
    'proc.h2':'ව්‍යාපෘතියක් <em>ක්‍රියාත්මක වන</em> ආකාරය',
    'faq.h2':'<em>අපෙන් නිතර</em> අසන ප්‍රශ්න',
    'cta.h2':'අදහසක් තිබේද? <em>අපි එකට එය සාදමු.</em>',
    'ct.h2':'ඔබට <em>අවශ්‍ය දේ</em> අපට කියන්න.',
    'ft.top':'නැවත ඉහළට ↑'
  };
  Object.keys(SI_HTML).forEach(function(k){ SI[k] = SI_HTML[k]; });
  var EN = {
    'pos.done':'Sale complete. Bill #{n}, {total}.',
    'pos.first':'Add items before completing a sale.',
    'form.err':'Please add your name and a few details first.',
    'form.wa':'Opening WhatsApp with your message.',
    'form.mail':'Opening your email app with your message.'
  };
  var lang = 'en';
  var textNodes = $$('[data-i18n]');
  var phNodes = $$('[data-i18n-ph]');
  textNodes.forEach(function(n){ EN[n.getAttribute('data-i18n')] = n.hasAttribute('data-i18n-html') ? n.innerHTML.trim() : n.textContent; });
  phNodes.forEach(function(n){ EN[n.getAttribute('data-i18n-ph')] = n.getAttribute('placeholder'); });
  function t(k){ return (lang === 'si' && SI[k]) ? SI[k] : (EN[k] || k); }
  var langBtn = $('#langBtn');
  function setLang(l){
    lang = l;
    root.lang = (l === 'si') ? 'si' : 'en';
    textNodes.forEach(function(n){ var v = t(n.getAttribute('data-i18n')); if(n.hasAttribute('data-i18n-html')) n.innerHTML = v; else n.textContent = v; });
    phNodes.forEach(function(n){ n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph'))); });
    langBtn.textContent = (l === 'si') ? 'English' : 'සිංහල';
    store.set('pis-lang', l);
    if(window.__rot) window.__rot.reset();
  }
  langBtn.addEventListener('click', function(){ setLang(lang === 'si' ? 'en' : 'si'); });

  /* ---- Mobile menu ---- */
  var hdr = $('#hdr'), menuBtn = $('#menuBtn');
  function closeMenu(){ hdr.classList.remove('open'); menuBtn.setAttribute('aria-expanded','false'); }
  menuBtn.addEventListener('click', function(){
    var open = hdr.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#nav a').forEach(function(a){ a.addEventListener('click', closeMenu); });

  /* ---- Accordions: one open at a time per group ---- */
  $$('.acc').forEach(function(acc){
    var all = $$('details', acc);
    all.forEach(function(d){
      d.addEventListener('toggle', function(){
        if(d.open){ all.forEach(function(o){ if(o !== d) o.open = false; }); }
      });
    });
  });

  /* ---- "Ask about this" links pre-select the service ---- */
  $$('[data-need]').forEach(function(a){
    a.addEventListener('click', function(){ $('#need').value = a.getAttribute('data-need'); });
  });

  /* ---- POS demo ---- */
  var ITEMS = [
    {id:'tea', n:'Milk tea', p:120}, {id:'roll', n:'Egg roll', p:150},
    {id:'rice', n:'Rice & curry', p:450}, {id:'kottu', n:'Kottu', p:850},
    {id:'bun', n:'Fish bun', p:110}, {id:'water', n:'Water 500ml', p:100}
  ];
  function fmt(n){ return 'Rs. ' + n.toLocaleString('en-US'); }
  var bill = {}, sale = 1001;
  var itemsEl = $('#items'), linesEl = $('#lines'), totalEl = $('#total'), emptyEl = $('#empty'), posMsg = $('#posMsg');
  itemsEl.innerHTML = ITEMS.map(function(i){
    return '<button type="button" class="item" data-id="' + i.id + '"><strong>' + i.n + '</strong><span>' + fmt(i.p) + '</span></button>';
  }).join('');
  function renderBill(bump){
    var active = document.activeElement;
    var keep = (active && active.getAttribute && active.getAttribute('data-act')) ? [active.getAttribute('data-act'), active.getAttribute('data-id')] : null;
    var rows = ITEMS.filter(function(i){ return bill[i.id]; });
    linesEl.innerHTML = rows.map(function(i){
      return '<li><span>' + i.n + '</span><span class="qty">' +
        '<button type="button" data-act="dec" data-id="' + i.id + '" aria-label="Remove one ' + i.n + '">\u2212</button>' +
        '<b>' + bill[i.id] + '</b>' +
        '<button type="button" data-act="inc" data-id="' + i.id + '" aria-label="Add one ' + i.n + '">+</button></span>' +
        '<span class="lt">' + fmt(i.p * bill[i.id]) + '</span></li>';
    }).join('');
    var total = rows.reduce(function(s,i){ return s + i.p * bill[i.id]; }, 0);
    totalEl.textContent = fmt(total);
    emptyEl.hidden = rows.length > 0;
    if(bump){ totalEl.classList.remove('bump'); void totalEl.offsetWidth; totalEl.classList.add('bump'); }
    if(keep){ var b = $('button[data-act="' + keep[0] + '"][data-id="' + keep[1] + '"]', linesEl); if(b) b.focus(); }
    return total;
  }
  itemsEl.addEventListener('click', function(e){
    var b = e.target.closest('.item'); if(!b) return;
    var id = b.getAttribute('data-id');
    bill[id] = (bill[id] || 0) + 1; posMsg.textContent = ''; renderBill(true);
  });
  linesEl.addEventListener('click', function(e){
    var b = e.target.closest('button[data-act]'); if(!b) return;
    var id = b.getAttribute('data-id');
    bill[id] = (bill[id] || 0) + (b.getAttribute('data-act') === 'inc' ? 1 : -1);
    if(bill[id] <= 0) delete bill[id];
    renderBill(true);
  });
  $('#clear').addEventListener('click', function(){ bill = {}; posMsg.textContent = ''; renderBill(false); });
  $('#pay').addEventListener('click', function(){
    var total = renderBill(false);
    if(!total){ posMsg.textContent = t('pos.first'); return; }
    posMsg.textContent = t('pos.done').replace('{n}', sale).replace('{total}', fmt(total));
    sale++; bill = {}; renderBill(false);
  });
  renderBill(false);

  /* tilt the till toward the pointer (mouse only) */
  var tw = $('.tilt-wrap'), till = $('.till');
  if(!reduce.matches){
    tw.addEventListener('pointermove', function(e){
      if(e.pointerType !== 'mouse') return;
      var r = tw.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      till.style.transform = 'rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 8) + 'deg)';
    });
    tw.addEventListener('pointerleave', function(){ till.style.transform = ''; });
  }

  /* ---- Contact form -> WhatsApp / email ---- */
  var fmsg = $('#fmsg');
  function send(kind){
    var name = $('#f-name').value.trim(), phone = $('#f-phone').value.trim();
    var need = $('#need').value, details = $('#f-details').value.trim();
    if(!name || !details){
      fmsg.textContent = t('form.err');
      (name ? $('#f-details') : $('#f-name')).focus();
      return;
    }
    var text = 'Hello Prime IT Solutions,\nMy name is ' + name + '.\nI need: ' + need + '.\n' + details + (phone ? '\nMy number: ' + phone : '');
    var url = (kind === 'wa')
      ? 'https://wa.me/94765316063?text=' + encodeURIComponent(text)
      : 'mailto:primeitsolutionsplc@gmail.com?subject=' + encodeURIComponent('New enquiry: ' + need) + '&body=' + encodeURIComponent(text);
    var a = document.createElement('a');
    a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    fmsg.textContent = t(kind === 'wa' ? 'form.wa' : 'form.mail');
  }
  $('#sendWa').addEventListener('click', function(){ send('wa'); });
  $('#sendMail').addEventListener('click', function(){ send('mail'); });

  /* ---- Scroll progress bar ---- */
  var prog = $('#progress');
  function onScroll(){
    var m = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, (window.scrollY || 0) / m) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---- Header state ---- */
  function headerState(){ hdr.classList.toggle('scrolled', (window.scrollY || 0) > 8); }
  window.addEventListener('scroll', headerState, {passive: true}); headerState();

  /* ---- Reveal on scroll ---- */
  var revealSel = '.sec .eyebrow, .sec h2, .sec .intro, .pos-copy > p, .pos-copy > .btn, .tilt-wrap, .tags li, .steps li, .acc details, .formcard, .direct li, .why-card, .svc-card, .tabs, .show-stage, .deliver .mini, .cta-band';
  var revealEls = $$(revealSel);
  revealEls.forEach(function(el){
    var sibs = $$(':scope > ' + el.tagName.toLowerCase(), el.parentNode);
    el.classList.add('reveal');
    el.style.setProperty('--d', Math.max(0, sibs.indexOf(el)));
  });
  if('IntersectionObserver' in window && !reduce.matches){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ var el = en.target; el.classList.add('in','shown'); io.unobserve(el); setTimeout(function(){ el.classList.remove('reveal','in'); el.style.removeProperty('--d'); }, 1400); } });
    }, {threshold: 0.12, rootMargin: '0px 0px -6% 0px'});
    revealEls.forEach(function(el){ io.observe(el); });
  } else { revealEls.forEach(function(el){ el.classList.add('in','shown'); }); }

  /* ---- Process line fills as you scroll ---- */
  var stepsEl = $('.steps'), stepLis = $$('.steps li');
  function stepsProgress(){
    var r = stepsEl.getBoundingClientRect(), vh = window.innerHeight, mark = vh * 0.62;
    var p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
    stepsEl.style.setProperty('--p', p.toFixed(3));
    stepLis.forEach(function(li){ li.classList.toggle('on', li.getBoundingClientRect().top < mark); });
  }
  window.addEventListener('scroll', stepsProgress, {passive: true}); window.addEventListener('resize', stepsProgress); stepsProgress();

  /* ---- Cursor spotlight on cards ---- */
  $$('.till, .formcard, .glow-card').forEach(function(card){
    card.addEventListener('pointermove', function(e){
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px'); card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });


  /* ---- Hero typewriter ---- */
  var WORDS = {
    en: ['websites', 'POS systems', 'business software', 'custom web apps'],
    si: ['වෙබ් අඩවි', 'POS පද්ධති', 'ව්‍යාපාරික මෘදුකාංග', 'වෙබ් යෙදුම්']
  };
  var rotEl = $('#rotWord');
  if(rotEl){
    var wi = 0, ci = 0, del = false, timer = null;
    var chars = function(w){ return Array.from ? Array.from(w) : w.split(''); };
    var tick = function(){
      var list = WORDS[lang] || WORDS.en, w = chars(list[wi % list.length]);
      if(!del){
        ci++; rotEl.textContent = w.slice(0, ci).join('');
        if(ci >= w.length){ del = true; timer = setTimeout(tick, 2100); return; }
        timer = setTimeout(tick, 70 + Math.random() * 50);
      } else {
        ci--; rotEl.textContent = w.slice(0, Math.max(0, ci)).join('');
        if(ci <= 0){ del = false; wi++; timer = setTimeout(tick, 320); return; }
        timer = setTimeout(tick, 34);
      }
    };
    window.__rot = { reset: function(){
      clearTimeout(timer); wi = 0;
      var list = WORDS[lang] || WORDS.en;
      if(reduce.matches){ rotEl.textContent = list[0]; return; }
      ci = chars(list[0]).length; del = true; rotEl.textContent = list[0]; timer = setTimeout(tick, 2400);
    } };
    window.__rot.reset();
  }

  /* ---- Sample-work tabs ---- */
  var tabs = $$('.tab'), panels = $$('.panel');
  function countUp(panel){
    $$('[data-count]', panel).forEach(function(b){
      var end = +b.getAttribute('data-count'), pre = b.getAttribute('data-pre') || '', t0 = null;
      if(reduce.matches){ b.textContent = pre + end.toLocaleString('en-US'); return; }
      function step(ts){
        if(!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
        b.textContent = pre + Math.round(end * e).toLocaleString('en-US');
        if(k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  function selectTab(tab, focus){
    tabs.forEach(function(tb){
      var on = tb === tab;
      tb.setAttribute('aria-selected', on ? 'true' : 'false');
      tb.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function(p){ p.hidden = p.id !== tab.getAttribute('aria-controls'); });
    var panel = $('#' + tab.getAttribute('aria-controls'));
    countUp(panel);
    if(focus) tab.focus();
  }
  tabs.forEach(function(tb, i){
    tb.addEventListener('click', function(){ selectTab(tb); });
    tb.addEventListener('keydown', function(e){
      var n = null;
      if(e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if(e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if(e.key === 'Home') n = tabs[0];
      else if(e.key === 'End') n = tabs[tabs.length - 1];
      if(n){ e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---- Magnetic primary buttons (mouse only) ---- */
  if(!reduce.matches){
    $$('.magnet').forEach(function(b){
      b.addEventListener('pointermove', function(e){
        if(e.pointerType !== 'mouse') return;
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28) + 'px)';
      });
      b.addEventListener('pointerleave', function(){ b.style.transform = ''; });
    });
  }

  /* ---- Hide the floating WhatsApp button while the contact form is on screen ---- */
  var waF = $('.wa-float'), contact = $('#contact');
  if(waF && contact && 'IntersectionObserver' in window){
    new IntersectionObserver(function(en){
      waF.style.visibility = en[0].isIntersecting ? 'hidden' : '';
    }, {threshold: 0.35}).observe(contact);
  }


  /* ---- Cursor light (mouse only) ---- */
  var cl = $('#cursorLight');
  if(cl && !reduce.matches && window.matchMedia('(pointer:fine)').matches){
    var cx = 0, cy = 0, tx = 0, ty = 0, raf = null;
    var loop = function(){ cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14; cl.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5) ? requestAnimationFrame(loop) : null; };
    window.addEventListener('pointermove', function(e){ if(e.pointerType !== 'mouse') return; tx = e.clientX; ty = e.clientY; cl.classList.add('on'); if(!raf) raf = requestAnimationFrame(loop); }, {passive: true});
    document.addEventListener('mouseleave', function(){ cl.classList.remove('on'); });
  }

  /* ---- 3D tilt on cards (mouse only) ---- */
  if(!reduce.matches){
    $$('.tilt').forEach(function(c){
      c.addEventListener('pointermove', function(e){
        if(e.pointerType !== 'mouse') return;
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = 'perspective(1000px) rotateX(' + (-y * 7) + 'deg) rotateY(' + (x * 9) + 'deg) translateY(-4px)';
      });
      c.addEventListener('pointerleave', function(){ c.style.transform = ''; });
    });
  }

  /* ---- Highlight the nav link for the section on screen ---- */
  var navLinks = $$('#nav a');
  if('IntersectionObserver' in window){
    var navIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        navLinks.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, {rootMargin: '-45% 0px -50% 0px'});
    navLinks.forEach(function(a){ var sec = $(a.getAttribute('href')); if(sec) navIO.observe(sec); });
  }

  /* ---- Restore saved preferences ---- */
  if(store.get('pis-lang') === 'si'){ setLang('si'); }
})();

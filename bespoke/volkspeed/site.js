const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))closeMenu()});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('reveal-in');io.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.section-heading,.intro-grid,.electric-grid,.workshop-copy').forEach(e=>io.observe(e))}
const book=document.querySelector('[data-book]');
if(book){
 const status=document.querySelector('#load-status'),form=book.querySelector('form');
 try{
  const response=await fetch('config.json');if(!response.ok)throw Error('Configuration unavailable');
  window.SKIN=await response.json();
  await import('../../shared/book.js');
  book.querySelectorAll('.svc-price').forEach(e=>e.textContent='Quotation after review');
  const params=new URLSearchParams(location.search),branch=params.get('branch');
  if(branch){const input=[...form.querySelectorAll('[name=branch]')].find(e=>e.value===branch);if(input)input.checked=true;}
  // Keep the shared T2 enquiry engine; add client-specific opening-hour constraints.
  function hours(){
   const hq=form.querySelector('[name=branch]:checked')?.value==='hq';
   for(const date of form.querySelectorAll('[name=date]'))date.disabled=hq&&new Date(date.value+'T12:00:00').getDay()===0;
   let selected=form.querySelector('[name=date]:checked');
   if(!selected||selected.disabled){selected=form.querySelector('[name=date]:not(:disabled)');if(selected)selected.checked=true;}
   const saturday=selected&&new Date(selected.value+'T12:00:00').getDay()===6;
   const pm=form.querySelector('[name=window][value=pm]');pm.disabled=!!(hq&&saturday);
   if(pm.disabled&&pm.checked)form.querySelector('[name=window][value=am]').checked=true;
   document.querySelector('#branch-hours').textContent=hq?'Bukit Raja: Mon–Fri 9am–6pm; Sat 8:30am–1pm; Sun closed.':'Glenmarie: Mon–Fri 9:30am–6pm; Sat–Sun 9:30am–5pm.';
   form.dispatchEvent(new Event('input',{bubbles:true}));
  }
  form.addEventListener('change',e=>{if(['date','branch'].includes(e.target.name))hours()});hours();
  // Supplement native required checks: no whitespace-only names or implausibly short phones.
  form.addEventListener('submit',e=>{
   const name=form.elements.name,phone=form.elements.phone;
   name.setCustomValidity(name.value.trim().length<2?'Please enter your name.':'');
   const count=phone.value.replace(/\D/g,'').length;
   phone.setCustomValidity(count<9||count>15?'Please enter a phone number with 9–15 digits.':'');
   if(!form.checkValidity()){e.preventDefault();e.stopImmediatePropagation();form.reportValidity();}
  },true);
  form.addEventListener('input',()=>{form.elements.name.setCustomValidity('');form.elements.phone.setCustomValidity('')});
  status.hidden=true;form.hidden=false;
 }catch(error){status.textContent='The enquiry options could not load. Reload the page, or email kites.stdio@gmail.com to try the demo.';console.error(error);}
}

// Adapted from Feature Bench L-09 kinCycle; pause offscreen and respect motion preferences.
const kineticHero=document.querySelector('.hero'),motionButton=document.querySelector('.motion-toggle');
if(kineticHero&&motionButton){
 const preference=matchMedia('(prefers-reduced-motion: reduce)');let paused=false,visible=true;
 function syncMotion(){const running=!paused&&!preference.matches&&visible&&!document.hidden;kineticHero.classList.toggle('motion-on',running);motionButton.hidden=preference.matches;motionButton.textContent=paused?'Play motion':'Pause motion';motionButton.setAttribute('aria-pressed',String(paused));}
 motionButton.addEventListener('click',()=>{paused=!paused;syncMotion()});preference.addEventListener('change',syncMotion);document.addEventListener('visibilitychange',syncMotion);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion()},{threshold:.1}).observe(kineticHero);syncMotion();
}

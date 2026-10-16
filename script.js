'use strict';
const $ = s => document.querySelector(s);
const intro = $('#opening'), page = $('#page'), audio = $('#nasheed'), musicToggle = $('#musicToggle'), musicLabel = $('#musicLabel');
let toastTimer;
function toast(message){const node=$('#toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),3800)}
function syncMusic(){const playing=!audio.paused; musicToggle.classList.toggle('playing',playing); musicToggle.setAttribute('aria-pressed',String(playing));musicToggle.setAttribute('aria-label',playing?'Pause wedding nasheed':'Play wedding nasheed');musicLabel.textContent=playing?'Music on':'Music off'}
audio.addEventListener('play',syncMusic);audio.addEventListener('pause',syncMusic);audio.addEventListener('error',()=>toast('Music unavailable. Check that the MP3 is included in /assets.'));
$('#openInvitation').addEventListener('click',()=>{
  // The actual MP3 starts after an explicit user interaction, as required by mobile browsers.
  intro.classList.add('closed');document.body.classList.remove('is-locked');page.inert=false;
  audio.volume=.72;audio.play().catch(()=>toast('Tap “Music off” in the top bar to start the nasheed.'));
  setTimeout(()=>{intro.hidden=true;},1000);
  window.scrollTo({top:0,behavior:'instant'});
});
musicToggle.addEventListener('click',async()=>{if(audio.paused){try{await audio.play()}catch{toast('Your browser blocked sound. Please tap again.')}}else{audio.pause()}});
const weddingDate = new Date('2026-11-08T00:00:00+05:30'); // Countdown to Nikkah calendar day; no exact ceremony hour was given.
function updateCountdown(){const d=Math.max(0,Math.floor((weddingDate-Date.now())/1000));$('#days').textContent=String(Math.floor(d/86400)).padStart(2,'0');$('#hours').textContent=String(Math.floor(d%86400/3600)).padStart(2,'0');$('#minutes').textContent=String(Math.floor(d%3600/60)).padStart(2,'0');$('#seconds').textContent=String(d%60).padStart(2,'0')}
updateCountdown();setInterval(updateCountdown,1000);
if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px 50px 0px'});document.querySelectorAll('.reveal').forEach(el=>io.observe(el))}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'))}
const form=$('#rsvpForm'), status=$('#formStatus'), submit=$('#submitRsvp');
function setStatus(message,kind){status.textContent=message;status.className='form-status '+(kind||'')}
function attendanceUI(){const going=form.elements.attendance.value==='yes';$('#whichEvent').disabled=!going;$('#guestCount').disabled=!going;if(!going){$('#whichEvent').value='none';$('#guestCount').value='1'}else if($('#whichEvent').value==='none'){$('#whichEvent').value='both'}}
form.querySelectorAll('input[name="attendance"]').forEach(r=>r.addEventListener('change',attendanceUI));
form.addEventListener('submit',async e=>{
  e.preventDefault();const name=$('#guestName').value.trim();if(!name){setStatus('Please enter your name.','error');$('#guestName').focus();return}
  if($('#website').value)return;
  const data={name,attendance:form.elements.attendance.value,event:$('#whichEvent').value,guests:Number($('#guestCount').value),phone:$('#guestPhone').value.trim(),wishes:$('#wishes').value.trim(),website:$('#website').value};
  submit.disabled=true;submit.innerHTML='Sending RSVP <span>◌</span>';setStatus('Sending your reply…');
  try{const res=await fetch('/api/rsvp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const json=await res.json().catch(()=>({}));if(!res.ok)throw Error(json.error||'RSVP is not connected yet. Please ask the hosts to set up RSVP email notifications on Vercel.');setStatus('Thank you! Your RSVP has been sent to the hosts. ✦','success');submit.innerHTML='RSVP sent ✓';form.reset();attendanceUI()}
  catch(err){setStatus(location.protocol==='file:'?'The RSVP form works on the published Vercel site, once email settings are connected.':err.message,'error');submit.disabled=false;submit.innerHTML='Send my RSVP <span>↗</span>'}
});
$('#shareBtn').addEventListener('click',async()=>{const title='Rana & Sadique — Wedding Invitation';const text='You are warmly invited to celebrate Fathimathul Rana & Muhammed Sadique, 8–9 November 2026. ✦';try{if(navigator.share){await navigator.share({title,text,url:location.href})}else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);toast('Invitation link copied!')}else{toast('Copy the link in your browser to share it.')}}catch(err){if(err.name!=='AbortError')toast('Please copy the browser link to share.') }});

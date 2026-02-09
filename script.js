let emps = JSON.parse(localStorage.getItem('my_emps')) || [];
let atts = JSON.parse(localStorage.getItem('my_atts')) || [];
let selectedId = null;

function renderEmps() {
  const container = document.getElementById('empList');
  if (!container) return;
  container.innerHTML = emps.map(e => `<div class="emp-item" onclick="openModal('${e.id}')">${e.name}</div>`).join('');
}

function addEmployee() {
  const name = document.getElementById('empName').value.trim();
  const job = document.getElementById('empJob').value.trim();
  if (name && job) {
    const id = Date.now().toString();
    emps.push({ id, name, job });
    save();
    document.getElementById('empName').value = '';
    document.getElementById('empJob').value = '';
    renderEmps();
  }
}

function openModal(id) {
  selectedId = id;
  const emp = emps.find(e => e.id === id);
  document.getElementById('targetName').innerText = emp.name;
  document.getElementById('targetJob').innerText = emp.job;
  document.getElementById('attendanceModal').style.display = "block";
  renderAtt();
}

function closeModal() { document.getElementById('attendanceModal').style.display = "none"; }

document.getElementById('attForm').onsubmit = function(e) {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const tIn = document.getElementById('in').value;
  const tOut = document.getElementById('out').value;
  const noteVal = document.getElementById('note').value.trim(); 
  
  const mIn = (parseInt(tIn.split(':')[0]) * 60) + parseInt(tIn.split(':')[1]);
  const mOut = (parseInt(tOut.split(':')[0]) * 60) + parseInt(tOut.split(':')[1]);
  let diff = mOut - mIn;
  if (diff < 0) diff += 1440;

  atts.push({ 
    id: Date.now(), 
    empId: selectedId, 
    date, 
    diff, 
    timeRange: `من ${tIn} إلى ${tOut}`,
    note: noteVal 
  });
  
  save();
  renderAtt();
  e.target.reset();
};

function renderAtt() {
  const myAtt = atts.filter(a => a.empId === selectedId);
  let totalMins = 0;
  
  document.getElementById('attTableBody').innerHTML = myAtt.map(a => {
    totalMins += a.diff;
    return `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;">${a.date}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">${Math.floor(a.diff/60)}س ${a.diff%60}د<br><small style="color:#1a73e8">${a.timeRange}</small></td>
        <td style="padding:8px; border-bottom:1px solid #eee; font-size:11px;">${a.note || '---'}</td>
        <td onclick="delAtt(${a.id})" style="color:red; cursor:pointer;">✕</td>
      </tr>
    `;
  }).join('');

  // تحديث الإجماليات في النافذة
  document.getElementById('totalDays').innerText = myAtt.length;
  document.getElementById('totalHours').innerText = Math.floor(totalMins/60) + " ساعة";
}

function save() {
  localStorage.setItem('my_emps', JSON.stringify(emps));
  localStorage.setItem('my_atts', JSON.stringify(atts));
}

function downloadAllEmpsPDF() {
    if (emps.length === 0) return alert("لا توجد بيانات");
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = ''; 

    emps.forEach(emp => {
        const empAtt = atts.filter(a => a.empId === emp.id);
        let totalMins = 0;
        
        let empHtml = `
            <div style="margin-bottom: 40px; page-break-inside: avoid; border: 2px solid #1a73e8; border-radius: 12px; overflow: hidden;">
                <div style="background: #1a73e8; color: white; padding: 15px; font-size: 18px; display: flex; justify-content: space-between;">
                    <span><b>الموظف:</b> ${emp.name}</span>
                    <span><b>الوظيفة:</b> ${emp.job}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; text-align: center;">
                    <thead>
                        <tr style="background: #f1f8ff; color: #1a73e8; border-bottom: 2px solid #1a73e8;">
                            <th style="padding: 12px; border: 1px solid #eee;">التاريخ</th>
                            <th style="padding: 12px; border: 1px solid #eee;">مدة العمل</th>
                            <th style="padding: 12px; border: 1px solid #eee;">الفترة</th>
                            <th style="padding: 12px; border: 1px solid #eee;">الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        empAtt.forEach(a => {
            totalMins += a.diff;
            empHtml += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #eee; font-weight: bold;">${a.date}</td>
                    <td style="padding: 10px; border: 1px solid #eee;">${Math.floor(a.diff/60)} ساعة و ${a.diff%60} دقيقة</td>
                    <td style="padding: 10px; border: 1px solid #eee; color: #1a73e8;">${a.timeRange}</td>
                    <td style="padding: 10px; border: 1px solid #eee; color: #666; font-style: italic;">${a.note || '---'}</td>
                </tr>`;
        });

        empHtml += `
                    </tbody>
                </table>
                <div style="background: #e3f2fd; padding: 15px; border-top: 2px solid #1a73e8; font-size: 16px; font-weight: bold; color: #0d47a1;">
                    📊 الخلاصة: إجمالي الأيام (${empAtt.length}) | إجمالي الساعات المستحقة (${Math.floor(totalMins/60)} ساعة و ${totalMins%60} دقيقة)
                </div>
            </div>
        `;
        reportContent.innerHTML += empHtml;
    });

    const element = document.getElementById('full-report-template');
    element.style.display = 'block';

    html2pdf().set({
        margin: 0.5,
        filename: 'تقرير_الموظفين_الشامل.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).from(element).save().then(() => {
        element.style.display = 'none';
    });
}

function delAtt(id) {
  if(confirm("حذف هذا السجل؟")) {
    atts = atts.filter(a => a.id !== id);
    save();
    renderAtt();
  }
}

function deleteFullEmp() {
  if(confirm("حذف الموظف نهائياً؟")) {
    emps = emps.filter(e => e.id !== selectedId);
    atts = atts.filter(a => a.empId !== selectedId);
    save();
    closeModal();
    renderEmps();
  }
}

renderEmps();

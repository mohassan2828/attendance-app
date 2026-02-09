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
  // إصلاح: التأكد من جلب القيمة من id="note"
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
    note: noteVal // حفظ الملاحظة بنجاح
  });
  
  save();
  renderAtt();
  e.target.reset();
};

function renderAtt() {
  const myAtt = atts.filter(a => a.empId === selectedId);
  document.getElementById('attTableBody').innerHTML = myAtt.map(a => `
    <tr>
      <td style="padding:10px;">${a.date}</td>
      <td style="padding:10px;">${Math.floor(a.diff/60)}س و ${a.diff%60}د<br><small style="color:#1a73e8">${a.timeRange}</small></td>
      <td style="padding:10px; color:#555; font-size:11px;">${a.note || '---'}</td>
      <td onclick="delAtt(${a.id})" style="color:#dc3545; cursor:pointer; font-weight:bold;">✕</td>
    </tr>
  `).join('');
}

function save() {
  localStorage.setItem('my_emps', JSON.stringify(emps));
  localStorage.setItem('my_atts', JSON.stringify(atts));
}

function downloadAllEmpsPDF() {
    if (emps.length === 0) return alert("لا يوجد بيانات لتصديرها");
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = ''; 

    emps.forEach(emp => {
        const empAtt = atts.filter(a => a.empId === emp.id);
        let totalMins = 0;
        
        let empHtml = `
            <div style="margin-bottom: 40px; page-break-inside: avoid;">
                <div style="background: #1a73e8; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between;">
                    <span style="font-weight: bold;">الموظف: ${emp.name}</span>
                    <span>الوظيفة: ${emp.job}</span>
                </div>
                <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1px solid #1a73e8;">
                    <thead>
                        <tr style="background: #e8f0fe; color: #1a73e8;">
                            <th style="padding: 10px; border: 1px solid #1a73e8;">التاريخ</th>
                            <th style="padding: 10px; border: 1px solid #1a73e8;">المدة</th>
                            <th style="padding: 10px; border: 1px solid #1a73e8;">الوقت</th>
                            <th style="padding: 10px; border: 1px solid #1a73e8;">الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        empAtt.forEach(a => {
            totalMins += a.diff;
            empHtml += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #eee;">${a.date}</td>
                    <td style="padding: 8px; border: 1px solid #eee;">${Math.floor(a.diff/60)}س ${a.diff%60}د</td>
                    <td style="padding: 8px; border: 1px solid #eee;">${a.timeRange}</td>
                    <td style="padding: 8px; border: 1px solid #eee; color: #555;">${a.note || '---'}</td>
                </tr>`;
        });

        empHtml += `
                    </tbody>
                </table>
                <div style="background: #f8f9fa; padding: 10px; border: 1px solid #1a73e8; border-top: none; border-radius: 0 0 8px 8px; font-weight: bold;">
                    إجمالي الساعات لهذا الموظف: ${Math.floor(totalMins/60)} ساعة و ${totalMins%60} دقيقة
                </div>
            </div>
        `;
        reportContent.innerHTML += empHtml;
    });

    const element = document.getElementById('full-report-template');
    element.style.display = 'block';

    const opt = {
        margin: 0.3,
        filename: 'تقرير_الحضور_المطور.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
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
  if(confirm("هل أنت متأكد من حذف الموظف وكل سجلاته نهائياً؟")) {
    emps = emps.filter(e => e.id !== selectedId);
    atts = atts.filter(a => a.empId !== selectedId);
    save();
    closeModal();
    renderEmps();
  }
}

renderEmps();

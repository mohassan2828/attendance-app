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
  const note = document.getElementById('note').value.trim(); // جلب الملاحظة
  
  const mIn = (parseInt(tIn.split(':')[0]) * 60) + parseInt(tIn.split(':')[1]);
  const mOut = (parseInt(tOut.split(':')[0]) * 60) + parseInt(tOut.split(':')[1]);
  let diff = mOut - mIn;
  if (diff < 0) diff += 1440;

  atts.push({ 
    id: Date.now(), 
    empId: selectedId, 
    date, 
    diff, 
    timeRange: `${tIn} - ${tOut}`,
    note: note // حفظ الملاحظة
  });
  
  save();
  renderAtt();
  e.target.reset();
};

function renderAtt() {
  const myAtt = atts.filter(a => a.empId === selectedId);
  document.getElementById('attTableBody').innerHTML = myAtt.map(a => `
    <tr>
      <td>${a.date}</td>
      <td>${Math.floor(a.diff/60)}س<br><small>${a.timeRange}</small></td>
      <td style="font-size:11px; color:#555;">${a.note || '---'}</td>
      <td onclick="delAtt(${a.id})" style="color:red;">✕</td>
    </tr>
  `).join('');
}

function save() {
  localStorage.setItem('my_emps', JSON.stringify(emps));
  localStorage.setItem('my_atts', JSON.stringify(atts));
}

function downloadAllEmpsPDF() {
    if (emps.length === 0) return alert("لا يوجد بيانات");
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = ''; 

    emps.forEach(emp => {
        const empAtt = atts.filter(a => a.empId === emp.id);
        let empHtml = `
            <div style="margin-bottom: 30px; direction: rtl;">
                <h3>الموظف: ${emp.name} (${emp.job})</h3>
                <table border="1" style="width: 100%; border-collapse: collapse; text-align: center; font-size: 12px;">
                    <thead style="background: #eee;">
                        <tr>
                            <th>التاريخ</th>
                            <th>المدة</th>
                            <th>الوقت</th>
                            <th>الملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        empAtt.forEach(a => {
            empHtml += `
                <tr>
                    <td>${a.date}</td>
                    <td>${Math.floor(a.diff/60)}س ${a.diff%60}د</td>
                    <td>${a.timeRange}</td>
                    <td>${a.note || '---'}</td>
                </tr>`;
        });
        empHtml += `</tbody></table></div>`;
        reportContent.innerHTML += empHtml;
    });

    const element = document.getElementById('full-report-template');
    element.style.display = 'block';
    html2pdf().from(element).save().then(() => element.style.display = 'none');
}

function delAtt(id) {
  atts = atts.filter(a => a.id !== id);
  save();
  renderAtt();
}

function deleteFullEmp() {
  if(confirm("حذف الموظف؟")) {
    emps = emps.filter(e => e.id !== selectedId);
    atts = atts.filter(a => a.empId !== selectedId);
    save(); closeModal(); renderEmps();
  }
}

renderEmps();

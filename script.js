let emps = JSON.parse(localStorage.getItem('my_emps')) || [];
let atts = JSON.parse(localStorage.getItem('my_atts')) || [];
let selectedId = null;

function renderEmps() {
  const container = document.getElementById('empList');
  container.innerHTML = emps.map(e => `
    <div class="emp-item" onclick="openModal('${e.id}')">${e.name}</div>
  `).join('');
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
  } else { alert("اكتب الاسم والوظيفة أولاً"); }
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
  
  const mIn = (parseInt(tIn.split(':')[0]) * 60) + parseInt(tIn.split(':')[1]);
  const mOut = (parseInt(tOut.split(':')[0]) * 60) + parseInt(tOut.split(':')[1]);
  let diff = mOut - mIn;
  if (diff < 0) diff += 1440;

  // التعديل هنا: قمنا بإضافة وقت الحضور والانصراف للكائن المحفوظ
  atts.push({ 
    id: Date.now(), 
    empId: selectedId, 
    date, 
    diff,
    timeRange: `من ${tIn} إلى ${tOut}` // السطر الجديد المضاف
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
    // التعديل هنا: عرض وقت الحضور والانصراف بجانب الساعات والدقائق
    const timeDetail = a.timeRange ? `<br><small style="color:blue">${a.timeRange}</small>` : "";
    return `<tr>
      <td>${a.date}</td>
      <td>${Math.floor(a.diff/60)}س و ${a.diff%60}د ${timeDetail}</td>
      <td onclick="delAtt(${a.id})" style="color:red">✕</td>
    </tr>`;
  }).join('');
  
  document.getElementById('statDays').innerText = myAtt.length;
  document.getElementById('statHours').innerText = Math.floor(totalMins/60) + " ساعة";
}

function delAtt(id) {
  atts = atts.filter(a => a.id !== id);
  save();
  renderAtt();
}

function deleteFullEmp() {
  if(confirm("هل تريد حذف هذا الموظف وسجلاته نهائياً؟")) {
    emps = emps.filter(e => e.id !== selectedId);
    atts = atts.filter(a => a.empId !== selectedId);
    save();
    closeModal();
    renderEmps();
  }
}

function save() {
  localStorage.setItem('my_emps', JSON.stringify(emps));
  localStorage.setItem('my_atts', JSON.stringify(atts));
}

renderEmps();
function downloadAllEmpsPDF() {
    const reportContent = document.getElementById('report-content');
    reportContent.innerHTML = ''; // تفريغ المحتوى السابق

    if (emps.length === 0) return alert("لا يوجد موظفين لتصدير تقريرهم");

    // بناء محتوى التقرير لكل موظف
    emps.forEach(emp => {
        const empAtt = atts.filter(a => a.empId === emp.id);
        let totalMins = 0;
        
        let empHtml = `
            <div style="margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
                <h3>الموظف: ${emp.name} | الوظيفة: ${emp.job}</h3>
                <table border="1" style="width: 100%; border-collapse: collapse; text-align: center;">
                    <thead style="background: #f8f9fa;">
                        <tr>
                            <th style="padding: 8px;">التاريخ</th>
                            <th style="padding: 8px;">مدة العمل</th>
                            <th style="padding: 8px;">التفاصيل</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        empAtt.forEach(a => {
            totalMins += a.diff;
            empHtml += `
                <tr>
                    <td style="padding: 8px;">${a.date}</td>
                    <td style="padding: 8px;">${Math.floor(a.diff/60)}س و ${a.diff%60}د</td>
                    <td style="padding: 8px;">${a.timeRange || 'غير مسجل'}</td>
                </tr>
            `;
        });

        empHtml += `
                    </tbody>
                </table>
                <p><strong>إجمالي الأيام:</strong> ${empAtt.length} | <strong>إجمالي الساعات:</strong> ${Math.floor(totalMins/60)} ساعة</p>
            </div>
        `;
        reportContent.innerHTML += empHtml;
    });

    // إعدادات وتحميل الـ PDF
    const element = document.getElementById('full-report-template');
    element.style.display = 'block';

    const opt = {
        margin: 0.5,
        filename: 'التقرير_الشامل_للموظفين.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
    });
}

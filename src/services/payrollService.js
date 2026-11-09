export async function fetchPayrollData() {
  const [payrollResponse, employeesResponse] = await Promise.all([
    fetch('/mock/payroll.json'),
    fetch('/mock/employees.json'),
  ])
  if (!payrollResponse.ok) {
    throw new Error(`Data penggajian gagal dimuat (${payrollResponse.status}).`)
  }
  if (!employeesResponse.ok) {
    throw new Error(`Data karyawan gagal dimuat (${employeesResponse.status}).`)
  }

  const [payroll, employees] = await Promise.all([
    payrollResponse.json(),
    employeesResponse.json(),
  ])
  if (
    !Array.isArray(employees)
    || !Array.isArray(payroll.periods)
    || payroll.periods.length === 0
    || !Array.isArray(payroll.employees)
    || !Array.isArray(payroll.activities)
  ) {
    throw new Error('Format data penggajian tidak valid.')
  }

  const employeesById = Object.fromEntries(employees.map((employee) => [employee.id, employee]))
  const invalidPayroll = payroll.employees.find((payment) => (
    !employeesById[payment.employeeId]
    || !Number.isFinite(payment.nominal)
    || payment.nominal < 0
    || !payroll.periods.includes(payment.period)
  ))
  if (invalidPayroll) {
    throw new Error(`Data karyawan dengan ID ${invalidPayroll.employeeId} atau nominal gaji tidak valid.`)
  }
  if (!employeesById[payroll.currentEmployeeId]) {
    throw new Error('Data karyawan untuk ringkasan gaji pribadi tidak ditemukan.')
  }

  return {
    ...payroll,
    employees: payroll.employees.map((payment) => ({
      ...payment,
      employee: employeesById[payment.employeeId],
    })),
  }
}

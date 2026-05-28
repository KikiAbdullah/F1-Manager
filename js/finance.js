const Finance = {
  currentWizardBudget: 0,

  calculateWizardBudget() {
    // 1. Ambil modal dasar dari Sponsor (Sponsor pakai 'team_id' sebagai identifiernya)
    const selectedSponsor = Data.sponsors.find(
      (s) => (s.id || s.team_id) === WizardForm.sponsorId
    );

    let budgetTotal = 0;
    if (selectedSponsor && selectedSponsor.financials) {
      budgetTotal = selectedSponsor.financials.estimated_annual_value_idr;
    }

    // 2. Kurangi pengeluaran dari aset yang dipilih (Semua pakai 'price_idr')
    const tc = Data.team_chiefs.find((s) => s.id === WizardForm.teamChiefId);
    if (tc && tc.price_idr) budgetTotal -= tc.price_idr;

    const tech = Data.tech_chiefs.find((s) => s.id === WizardForm.techChiefId);
    if (tech && tech.price_idr) budgetTotal -= tech.price_idr;

    const pu = Data.power_units.find((p) => p.id === WizardForm.puId);
    if (pu && pu.price_idr) budgetTotal -= pu.price_idr;

    const ch = Data.chassis.find((c) => c.id === WizardForm.chassisId);
    if (ch && ch.price_idr) budgetTotal -= ch.price_idr;

    const d1 = Data.drivers.find((d) => d.id === WizardForm.driver1Id);
    if (d1 && d1.price_idr) budgetTotal -= d1.price_idr;

    const d2 = Data.drivers.find((d) => d.id === WizardForm.driver2Id);
    if (d2 && d2.price_idr) budgetTotal -= d2.price_idr;

    // 3. Update Visual HUD
    this.currentWizardBudget = budgetTotal;
    const hudText = document.getElementById("preview-budget-text");

    // Mencegah NaN merusak toLocaleString
    const safeBudget = isNaN(budgetTotal) ? 0 : budgetTotal;
    hudText.innerText = `Rp ${safeBudget.toLocaleString("id-ID")}`;

    const btnSubmit = document.getElementById("btn-wizard-submit");

    if (safeBudget < 0) {
      hudText.style.color = "#ff0000"; // Merah jika bangkrut
      if (btnSubmit) btnSubmit.disabled = true;
    } else {
      hudText.style.color = "#00ff87"; // Hijau neon jika aman
      if (btnSubmit) btnSubmit.disabled = false;
    }
  },
};

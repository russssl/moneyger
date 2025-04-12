export const checkStrength = (pass: string) => {
  const requirements = [
    { regex: /.{8,}/, text: "character_length" },
    { regex: /[0-9]/, text: "one_number" },
    { regex: /[a-z]/, text: "one_lowercase" },
    { regex: /[A-Z]/, text: "one_special_character" },
  ];

  return requirements.map((req) => ({
    met: req.regex.test(pass),
    text: req.text,
  }));
};

export const getStrengthColor = (score: number) => {
  if (score === 0) return "bg-border";
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score === 3) return "bg-amber-500";
  return "bg-emerald-500";
};

export const getStrengthText = (score: number) => {
  if (score === 0) return "enter_password";
  if (score <= 2) return "weak_password";
  if (score === 3) return "medium_password";
  return "strong_password";
};
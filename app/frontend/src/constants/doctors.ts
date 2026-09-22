import type { Doctor, DoctorId } from "@/types";

export const DOCTORS: Doctor[] = [
  { id: "carlos", name: "Dr. Carlos", label: "Dr. Carlos – Odontología", specialty: "Odontología" },
  { id: "liliana", name: "Dra. Liliana", label: "Dra. Liliana – Odontopediatría", specialty: "Odontopediatría" },
];

export const doctorById = (id: DoctorId) => DOCTORS.find((d) => d.id === id) ?? DOCTORS[0]!;

export const isDoctorId = (value: string): value is DoctorId => DOCTORS.some((d) => d.id === value);

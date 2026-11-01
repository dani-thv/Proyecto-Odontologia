package co.graciaosorio.clinica.service;

import java.time.LocalDate;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import co.graciaosorio.clinica.domain.Doctor;
import co.graciaosorio.clinica.domain.Payment;
import co.graciaosorio.clinica.domain.PaymentMethod;
import co.graciaosorio.clinica.dto.Dtos.CashClosingDto;
import co.graciaosorio.clinica.dto.Dtos.DoctorAmount;
import co.graciaosorio.clinica.dto.Dtos.MethodAmount;
import co.graciaosorio.clinica.repository.DoctorRepository;
import co.graciaosorio.clinica.repository.PaymentRepository;

/** Cierre de caja diario: lo recaudado por doctor (el de cada paciente) y por método de pago. */
@Service
@Transactional(readOnly = true)
public class CashClosingService {

    private final PaymentRepository payments;
    private final DoctorRepository doctors;

    public CashClosingService(PaymentRepository payments, DoctorRepository doctors) {
        this.payments = payments;
        this.doctors = doctors;
    }

    public CashClosingDto close(LocalDate date) {
        List<Payment> ofDay = payments.findByPaidOnWithDoctor(date);

        Map<String, Long> byDoctor = new LinkedHashMap<>();
        for (Doctor d : doctors.findByActiveTrueOrderBySortOrder()) {
            byDoctor.put(d.getId(), 0L);
        }
        Map<PaymentMethod, Long> byMethod = new EnumMap<>(PaymentMethod.class);
        for (PaymentMethod m : PaymentMethod.values()) {
            byMethod.put(m, 0L);
        }

        long total = 0;
        for (Payment p : ofDay) {
            total += p.getAmount();
            byMethod.merge(p.getMethod(), p.getAmount(), Long::sum);
            byDoctor.merge(p.getPlan().getPatient().getDoctor().getId(), p.getAmount(), Long::sum);
        }

        return new CashClosingDto(date, total,
                byDoctor.entrySet().stream().map(e -> new DoctorAmount(e.getKey(), e.getValue())).toList(),
                byMethod.entrySet().stream().map(e -> new MethodAmount(e.getKey(), e.getValue())).toList(),
                byMethod.get(PaymentMethod.EFECTIVO));
    }
}

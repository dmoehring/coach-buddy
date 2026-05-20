package de.moehring.coach.buddy.backend.person.entities;

import de.moehring.coach.buddy.backend.person.util.PhoneType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "phone_number")
@Getter
@Setter
@NoArgsConstructor
public class PhoneNumber {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PhoneType type;

    @Column(name = "number", nullable = false, length = 50)
    private String number;
}

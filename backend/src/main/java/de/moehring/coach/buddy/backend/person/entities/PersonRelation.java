package de.moehring.coach.buddy.backend.person.entities;

import de.moehring.coach.buddy.backend.person.util.RelationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "person_relation")
@Getter
@Setter
@NoArgsConstructor
public class PersonRelation {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "child_person_id", nullable = false)
    private Person childPerson;

    @ManyToOne(optional = false)
    @JoinColumn(name = "guardian_person_id", nullable = false)
    private Person guardianPerson;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation_type", nullable = false)
    private RelationType relationType;

}

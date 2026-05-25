package de.moehring.coach.buddy.backend.team.entities;

import de.moehring.coach.buddy.backend.person.entities.Person;
import de.moehring.coach.buddy.backend.team.util.TeamMemberRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "team_membership")
@Getter
@Setter
@NoArgsConstructor
public class TeamMembership {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(optional = false)
    @JoinColumn(name = "person_id", nullable = false)
    private Person person;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private TeamMemberRole role;

    @Column(name = "joined_at", nullable = false)
    private LocalDate joinedAt;

    @Column(name = "left_at")
    private LocalDate leftAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
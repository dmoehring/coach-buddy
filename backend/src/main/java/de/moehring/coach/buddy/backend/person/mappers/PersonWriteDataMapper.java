package de.moehring.coach.buddy.backend.person.mappers;

import de.moehring.coach.buddy.backend.person.dtos.CreatePersonRequest;
import de.moehring.coach.buddy.backend.person.dtos.CreatePhoneNumberRequest;
import de.moehring.coach.buddy.backend.person.dtos.UpdatePersonRequest;
import de.moehring.coach.buddy.backend.person.dtos.UpdatePhoneNumberRequest;
import de.moehring.coach.buddy.backend.person.model.PersonWriteData;
import de.moehring.coach.buddy.backend.person.model.PhoneNumberWriteData;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class PersonWriteDataMapper {

    public PersonWriteData from(CreatePersonRequest request) {
        return new PersonWriteData(
                trimRequired(request.firstName()),
                trimRequired(request.lastName()),
                request.birthDate(),
                trimToNull(request.nickname()),
                trimToNull(request.notes()),
                mapCreatePhoneNumbers(request.phoneNumbers())
        );
    }

    public PersonWriteData from(UpdatePersonRequest request) {
        return new PersonWriteData(
                trimRequired(request.firstName()),
                trimRequired(request.lastName()),
                request.birthDate(),
                trimToNull(request.nickname()),
                trimToNull(request.notes()),
                mapUpdatePhoneNumbers(request.phoneNumbers())
        );
    }

    private List<PhoneNumberWriteData> mapCreatePhoneNumbers(List<CreatePhoneNumberRequest> phoneNumbers) {
        if (phoneNumbers == null) {
            return List.of();
        }

        return phoneNumbers.stream()
                .map(phoneNumber -> new PhoneNumberWriteData(
                        phoneNumber.type(),
                        trimRequired(phoneNumber.number())
                ))
                .toList();
    }

    private List<PhoneNumberWriteData> mapUpdatePhoneNumbers(List<UpdatePhoneNumberRequest> phoneNumbers) {
        if (phoneNumbers == null) {
            return List.of();
        }

        return phoneNumbers.stream()
                .map(phoneNumber -> new PhoneNumberWriteData(
                        phoneNumber.type(),
                        trimRequired(phoneNumber.number())
                ))
                .toList();
    }

    private String trimRequired(String value) {
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
package de.moehring.coach.buddy.backend.export.resources;

import de.moehring.coach.buddy.backend.common.exceptions.ErrorResponse;
import de.moehring.coach.buddy.backend.export.services.ExportService;
import de.moehring.coach.buddy.backend.export.services.ExportService.CsvExport;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.UUID;

@Path("/api/v1/exports")
@RequiredArgsConstructor
@Tag(name = "Exports", description = "CSV-Exporte von Mitgliedern, Teilnehmern und Anwesenheiten")
public class ExportResource {

    public static final String CSV = "text/csv;charset=UTF-8";

    private final ExportService exportService;

    @GET
    @Path("/members")
    @Produces(CSV)
    @Operation(
            summary = "Export members",
            description = "CSV with contact data of team members. Without teamId all teams are included; "
                    + "by default only active members (no left date) are exported."
    )
    @APIResponses(value = {
            @APIResponse(responseCode = "200", description = "CSV file", content = @Content(
                    mediaType = CSV,
                    schema = @Schema(type = SchemaType.STRING, format = "binary")
            )),
            @APIResponse(responseCode = "404", description = "Team not found", content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(implementation = ErrorResponse.class)
            ))
    })
    public Response exportMembers(
            @QueryParam("teamId") UUID teamId,
            @QueryParam("activeOnly") @DefaultValue("true") boolean activeOnly
    ) {
        return csv(exportService.exportMembers(teamId, activeOnly));
    }

    @GET
    @Path("/trainings/{id}/participants")
    @Produces(CSV)
    @Operation(
            summary = "Export training participants",
            description = "CSV with the participants of a training or game day. Game days additionally contain "
                    + "jersey number, minutes played and minutes in goal. By default only present participants are exported."
    )
    @APIResponses(value = {
            @APIResponse(responseCode = "200", description = "CSV file", content = @Content(
                    mediaType = CSV,
                    schema = @Schema(type = SchemaType.STRING, format = "binary")
            )),
            @APIResponse(responseCode = "404", description = "Training not found", content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(implementation = ErrorResponse.class)
            ))
    })
    public Response exportTrainingParticipants(
            @PathParam("id") UUID id,
            @QueryParam("onlyPresent") @DefaultValue("true") boolean onlyPresent
    ) {
        return csv(exportService.exportTrainingParticipants(id, onlyPresent));
    }

    @GET
    @Path("/teams/{id}/attendance")
    @Produces(CSV)
    @Operation(
            summary = "Export attendance matrix",
            description = "CSV with one row per team member and one column per completed training, "
                    + "including totals and attendance rate."
    )
    @APIResponses(value = {
            @APIResponse(responseCode = "200", description = "CSV file", content = @Content(
                    mediaType = CSV,
                    schema = @Schema(type = SchemaType.STRING, format = "binary")
            )),
            @APIResponse(responseCode = "404", description = "Team not found", content = @Content(
                    mediaType = MediaType.APPLICATION_JSON,
                    schema = @Schema(implementation = ErrorResponse.class)
            ))
    })
    public Response exportAttendance(@PathParam("id") UUID id) {
        return csv(exportService.exportAttendanceMatrix(id));
    }

    private Response csv(CsvExport export) {
        return Response.ok(export.content())
                .header("Content-Disposition", "attachment; filename=\"" + export.fileName() + "\"")
                .build();
    }
}

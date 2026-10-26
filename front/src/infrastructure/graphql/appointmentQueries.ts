const FIELDS = /* GraphQL */ `
   fragment AppointmentFields on Appointment {
      id date hour state price
      client { id name tel }
      service { id name duration }
   }
`

export const QUERY_SERVICES = /* GraphQL */ `
   query Servicios { services { id name description price duration } }
`

export const QUERY_AVAILABLE_HOURS = /* GraphQL */ `
   query Horarios($date: String!, $idService: ID!) {
      availableHours(date: $date, idService: $idService)
   }
`

export const QUERY_MY_APPOINTMENTS = /* GraphQL */ `
   query MisCitas { appointments { ...AppointmentFields } }
   ${FIELDS}
`

export const MUTATION_CREATE_APPOINTMENT = /* GraphQL */ `
   mutation Agendar($data: AppointmentInput!) {
      createAppointment(data: $data) { ...AppointmentFields }
   }
   ${FIELDS}
`
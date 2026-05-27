import { renderNavbar } from "./src/components/navbar.js";
import { getTeams } from "./src/api/teamsApi.js";
import { getDraftSeasonsByTeam, getDraftResultsByTeamAndYear } from "./src/api/draftResultsApi.js";

renderNavbar()
GIVEN some other url
WHEN user navigates to [url]
THEN
- display loading screen
- query for movies in some default way

GIVEN user navigated to [url] AND query field has not changed
WHEN default query is successful,
THEN display (result screen)

3. GIVEN url not [url] AND user navigates to [url] AND query field has not changed
- WHEN default query is not successful, THEN display (error screen)
4. GIVEN user navigated to [url] AND query field has not changed
- WHEN query field changes AND query field is not empty, THEN
- query for movies containing the content of <query> field
- display loading screen
5. GIVEN user navigated to [url], AND query field changed AND query field is not empty
- WHEN query is successful, THEN display (result screen)
6. GIVEN user navigated to [url], AND query field changed AND query field is not empty
- WHEN query is not successful, THEN display (error screen).
7. GIVEN user navigated to [url] AND query field changed
- WHEN query field changes AND query field is empty, THEN
- display loading screen
- query for movies in some default way
8. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful
- WHEN user clicks on a movie, THEN
- display movie detail loading screen
- query for movie detail screen on top of movie screen
9. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful AND user clicked on a movie
- WHEN movie detail query is successful, THEN
- display movie detail screen
10. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful AND user clicked on a movie
- WHEN movie detail query is not successful, THEN
- display movie detail error screen
11. GIVEN user navigated to [url], AND query field changed AND query field is not empty AND query
was successful AND user clicks on a movie AND movie detail query is successful
- WHEN user clicks outside of the movie detail, THEN display (result screen) corresponding to
the query

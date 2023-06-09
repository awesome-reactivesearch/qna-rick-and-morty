import { AIAnswer, ReactiveBase, SearchBox } from "@appbaseio/reactivesearch";
import { Card, Col, Container, ListGroup, Navbar, Row } from "react-bootstrap";
import Fuse from "fuse.js";

import "bootstrap/dist/css/bootstrap.min.css";

import rickAndMortyImg from "./rick-and-morty.png";
import questions from "./questions.json";

import styles from "./App.module.css";
import { useState } from "react";
import getCharacterIcon from "./characterMap";

const SEARCH_COMPONENT_ID = "SEARCH_COMPONENT";
const AI_ANSWER_COMPONENT_ID = "AI_ANSWER";

function App() {
  const [feedData, setFeedData] = useState({ loading: true, hits: [] });
  return (
    <ReactiveBase
      app="rick-and-morty"
      url="https://a03a1cb71321:75b6603d-9456-4a5a-af6b-a487b309eb61@appbase-demo-ansible-abxiydt-arc.searchbase.io"
      theme={{
        typography: {
          fontFamily: "monospace",
          fontSize: "16px",
        },
        colors: {
          primaryTextColor: "#fff",
          primaryColor: "#06b0c8",
          titleColor: "#424242",
          alertColor: "#d9534f",
        },
      }}
      reactivesearchAPIConfig={{
        recordAnalytics: false,
        userId: "jon",
      }}
      transformRequest={(req) => {
        const body = JSON.parse(req.body);
        body.query = body.query.map((componentQuery) => {
          if (
            componentQuery.id === AI_ANSWER_COMPONENT_ID &&
            componentQuery.type === "search"
          ) {
            return {
              ...componentQuery,
              sortField: "index_number",
              sortOptions: [{ dataField: "index_number", sortBy: "asc" }],
            };
          }
          if (
            componentQuery.id === SEARCH_COMPONENT_ID &&
            componentQuery.type === "search"
          ) {
            const searchQuery = componentQuery.value;
            const matches = searchQuery.match(/in "(.*?)"\?$/);
            const episode = matches && matches[1];

            return {
              ...componentQuery,
              customQuery: episode
                ? {
                    query: {
                      term: {
                        "episode_name.keyword": episode,
                      },
                    },
                  }
                : undefined,
            };
          }
          return componentQuery;
        });
        body.settings = {
          recordAnalytics: false,
          backend: "opensearch",
        };
        const newReq = { ...req, body: JSON.stringify(body) };
        return newReq;
      }}
    >
      <div
        className={styles.backgroundImage}
        style={{ backgroundImage: `url(${rickAndMortyImg})` }}
      ></div>
      <Navbar bg="white" className="shadow mb-5" expand="lg">
        <Container>
          <Navbar.Brand>Reactivesearch</Navbar.Brand>
          <span className={`text-white ${styles.headingTag}`}>
            Rick and morty
          </span>
          <a href="https://hashnode.com/post/clhhn2fhs000b0aml57dbeuu5">
            How this is built
          </a>
        </Container>
      </Navbar>
      <SearchBox
        dataField={["episode_name", "name", "line"]}
        className={`mx-auto mt-2 ${styles.searchboxContainer}`}
        debounce={500}
        componentId={SEARCH_COMPONENT_ID}
        showClear
        highlight={false}
        size={5}
        autosuggest={true}
        onValueSelected={(value) => {
          if (value) window.scrollBy(0, 500);
        }}
        render={({
          downshiftProps: {
            isOpen,
            getItemProps,
            highlightedIndex,
            selectedItem,
          },
          data,
          value: searchQuery,
        }) => {
          const modifiedQuestions = questions.map((q) => ({
            ...q,
            question: q.episode
              ? `${q.question.replace(/\?$/, "")} in "${q.episode}"?`
              : q.question,
          }));
          const fuse = new Fuse(modifiedQuestions, { keys: ["question"] });
          const filteredData = fuse.search(searchQuery).map((res) => ({
            value: res.item.question,
            episode: res.item.episode,
            idx: res.refIndex,
          }));
          const defaultSuggestions = modifiedQuestions
            .filter((q, i) => i < 5)
            .map((item, i) => ({
              value: item.question,
              episode: item.episode,
              idx: i,
            }));

          return isOpen ? (
            <div className={`${styles.suggestions}`}>
              <div>
                <p className={`bg-gray p-2 m-0 ${styles.suggestionHeading}`}>
                  Try below suggestions
                </p>
                {filteredData.length ? (
                  <div>
                    {filteredData.map((item, index) =>
                      index < 6 ? (
                        <div
                          /* eslint-disable-next-line react/no-array-index-key */
                          key={item.idx}
                          {...getItemProps({
                            item,
                          })}
                          className={`${
                            highlightedIndex === index
                              ? styles.activeSuggestion
                              : styles.suggestion
                          } 
                                  ${
                                    selectedItem &&
                                    selectedItem.value === item.value
                                      ? styles.selectedSuggestion
                                      : ""
                                  }
                                  `}
                        >
                          <span className="clipText">{item.value}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                ) : (
                  <div>
                    {defaultSuggestions.map((item, index) =>
                      index < 6 ? (
                        <div
                          /* eslint-disable-next-line react/no-array-index-key */
                          key={item.idx}
                          {...getItemProps({
                            item,
                          })}
                          className={`${
                            highlightedIndex === index
                              ? styles.activeSuggestion
                              : styles.suggestion
                          } 
                              ${
                                selectedItem &&
                                selectedItem.value === item.value
                                  ? styles.selectedSuggestion
                                  : ""
                              }
                              `}
                        >
                          <span className="clipText">{item.value}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null;
        }}
      />
      <div id="answer-component" className={`px-5 pt-5 ${styles.answer}`}>
        <AIAnswer
          componentId={AI_ANSWER_COMPONENT_ID}
          showVoiceInput
          showIcon
          react={{ and: SEARCH_COMPONENT_ID }}
          AIConfig={{
            docTemplate: "'${source.name}', says '${source.line}'",
            queryTemplate: "${value}",
            topDocsForContext: 15,
          }}
          enterButton={true}
          onData={({ loading, rawData, data }) => {
            if (!loading && data.length) {
              if (rawData.hits && rawData.hits.hits)
                setFeedData({
                  loading: false,
                  hits: rawData.hits.hits.map((hit) => hit._source),
                });
            } else {
              setFeedData({ loading: true, hits: [] });
            }
          }}
        />
      </div>
      <div className="mx-5 my-2">
        <div className="row">
          <ListGroup className={styles.list} variant="flush">
            {!feedData.loading && (
              <>
                <h3 className="bg-white p-2">Dialogues used for answer</h3>
                <div>
                  {feedData.hits.map((item) => (
                    <ListGroup.Item
                      key={item.index}
                      className="py-4 px-2 container"
                    >
                      <Row>
                        <Col
                          md={1}
                          sm={2}
                          xs={3}
                          className="d-flex justify-content-center align-items-center"
                        >
                          <img
                            src={getCharacterIcon(item.name)}
                            style={{ width: "100%" }}
                          />
                        </Col>
                        <Col md={11} sm={10} xs={9}>
                          <h1 className="h5">
                            {item.episode_name} - Season {item["season no."]} -
                            Episode {item["episode no."]}
                          </h1>
                          <div>
                            {item.name}: "{item.line}"
                          </div>
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  ))}
                </div>
              </>
            )}
          </ListGroup>
        </div>
      </div>
    </ReactiveBase>
  );
}

export default App;
